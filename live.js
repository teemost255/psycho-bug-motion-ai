/*
 * Psycho Bug AI — live generation via Pollinations Pay (BYOP).
 *
 * No backend and no secret key in this repo: each visitor clicks "Connect",
 * signs in to Pollinations (GitHub login), and approves a small budget.
 * Requests are then paid from THEIR OWN Pollinations balance (free Quest
 * Pollen works for images). If nobody is connected, the page keeps its
 * simulated preview.
 *
 * Free Quest Pollen covers image models only. Every Pollinations video model
 * is "paid_only", so video jobs try real video first and, if the account has
 * no paid balance, fall back to a real AI keyframe with a motion effect,
 * clearly labelled as such.
 */
(function () {
  "use strict";

  var API = "https://gen.pollinations.ai";

  // Psycho Bug model names -> real Pollinations models (cheapest that fit).
  var MAP = {
    c2:   { kind: "image", model: "black-forest-labs/flux.1-schnell" },
    c2u:  { kind: "image", model: "tongyi-mai/z-image-turbo" },
    m3t:  { kind: "video", model: "alibaba/wan-2.2-fast",          frame: "black-forest-labs/flux.1-schnell" },
    m3:   { kind: "video", model: "prunaai/p-video",               frame: "tongyi-mai/z-image-turbo" },
    omni: { kind: "video", model: "bytedance/seedance-1-pro-fast", frame: "tongyi-mai/z-image-turbo" }
  };

  var SIZES = {
    "16:9": [1280, 720], "9:16": [720, 1280], "1:1": [1024, 1024], "21:9": [1344, 576]
  };

  // Each preset adds a style/motion direction to the prompt.
  var PRESET_HINTS = {
    "Larva": "",
    "Swarm Burst": "thousands of insects bursting toward the camera",
    "Molting Reveal": "slow molting reveal, old shell splitting open",
    "Compound Eye POV": "fractured compound-eye point of view, hexagonal distortion",
    "Night Crawl": "night, low crawling camera at ground level, moonlight",
    "Infestation Zoom": "slow push-in zoom revealing an infestation",
    "Shell Crack": "macro shot of a shell cracking, debris in slow motion",
    "Antenna Twitch": "extreme close-up, antennae twitching, shallow depth of field",
    "Static Hive": "VHS static, found-footage horror look",
    "Glitch Mantis": "digital glitch, chromatic aberration, datamosh",
    "Slow Bloom": "slow organic blooming growth, time-lapse",
    "Paranoia Dolly": "dolly zoom, vertigo effect, paranoid atmosphere"
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var key = null;

  /* ---------- UI: connect button + status ---------- */
  function mountUI() {
    var gen = $(".x-gen");
    if (!gen) return;
    var pill = $(".x-pill", gen);

    var box = document.createElement("div");
    box.className = "pb-live";
    box.innerHTML =
      '<div class="pb-live__row"><polli-connect budget="2" expiry="7" models="image,video"></polli-connect>' +
      '<span class="pb-live__status" id="pb-live-status">Not connected — preview mode</span></div>' +
      '<p class="pb-live__note">Connect a free Pollinations account to hatch real AI images. ' +
      'Real video needs paid Pollen; without it, video jobs return a real AI keyframe with motion.</p>';
    gen.insertBefore(box, pill || null);

    var css = document.createElement("style");
    css.textContent =
      ".pb-live{margin:12px 0 4px;padding:10px 12px;border:1px solid rgba(198,255,0,.25);border-radius:12px;background:rgba(198,255,0,.04)}" +
      ".pb-live__row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}" +
      ".pb-live__status{font-size:12px;opacity:.85}" +
      ".pb-live__status.is-on{color:#C6FF00;opacity:1}" +
      ".pb-live__note{font-size:11px;opacity:.65;margin:6px 0 0}" +
      ".x-result__media video{width:100%;height:100%;object-fit:cover;display:block}" +
      ".x-result__media img.pb-real{width:100%;height:100%;object-fit:cover}";
    document.head.appendChild(css);

    var connect = $("polli-connect", box);
    function sync() {
      key = connect.apiKey || null;
      var st = $("#pb-live-status");
      if (pill) pill.textContent = key
        ? "Live — generations are real and billed to your Pollinations balance."
        : "Preview build — generation is simulated until you connect Pollinations.";
      st.textContent = key ? "Connected — live generation on" : "Not connected — preview mode";
      st.classList.toggle("is-on", !!key);
    }
    connect.addEventListener("change", sync);
    // The component may restore a key from sessionStorage after load.
    setTimeout(sync, 800);
    sync();
  }

  /* ---------- API helpers ---------- */
  function authHeaders(extra) {
    var h = { Authorization: "Bearer " + key };
    for (var k in extra || {}) h[k] = extra[k];
    return h;
  }

  function errorFrom(res) {
    return res.text().then(function (t) {
      var msg = t;
      try { var j = JSON.parse(t); msg = (j.error && (j.error.message || j.error)) || j.message || t; } catch (e) {}
      var err = new Error(String(msg).slice(0, 240));
      err.status = res.status;
      throw err;
    });
  }

  function genImage(model, text, aspect) {
    var s = SIZES[aspect] || SIZES["16:9"];
    var url = API + "/image/" + encodeURIComponent(text) +
      "?model=" + encodeURIComponent(model) + "&width=" + s[0] + "&height=" + s[1] + "&nologo=true";
    return fetch(url, { headers: authHeaders() }).then(function (r) {
      if (!r.ok) return errorFrom(r);
      return r.blob();
    });
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function genVideo(model, text, aspect, seconds, sound, onTick) {
    var url = API + "/video/" + encodeURIComponent(text) +
      "?model=" + encodeURIComponent(model) + "&aspectRatio=" + encodeURIComponent(aspect === "21:9" ? "16:9" : aspect) +
      "&duration=" + seconds + "&audio=" + (sound ? "true" : "false");
    return fetch(url, { headers: authHeaders({ Prefer: "respond-async" }) }).then(function (r) {
      if (r.status === 200) return r.blob();
      if (r.status !== 202) return errorFrom(r);
      return r.json().then(function (job) {
        var started = Date.now();
        function poll() {
          return sleep(5000).then(function () {
            onTick && onTick(Math.round((Date.now() - started) / 1000));
            return fetch(API + "/v1/jobs/" + job.id, { headers: authHeaders() });
          }).then(function (s) {
            if (!s.ok) return errorFrom(s);
            return s.json();
          }).then(function (st) {
            if (st.status === "succeeded") {
              return fetch(API + "/v1/jobs/" + job.id + "/result", { headers: authHeaders() })
                .then(function (rr) { return rr.ok ? rr.blob() : errorFrom(rr); });
            }
            if (st.status === "failed" || st.status === "canceled") throw new Error("Video job " + st.status);
            if (Date.now() - started > 10 * 60 * 1000) throw new Error("Video timed out");
            return poll();
          });
        }
        return poll();
      });
    });
  }

  /* ---------- live generation ---------- */
  function presetName() {
    var el = $("#preset-name");
    return el ? el.textContent.trim() : "Larva";
  }

  function buildPrompt(text) {
    var hint = PRESET_HINTS[presetName()] || "";
    return text + (hint ? ", " + hint : "") + ", cinematic, dark psycho-horror mood, highly detailed";
  }

  function card(job) {
    var history = $("#view-history");
    var empty = $("#empty"); if (empty) empty.remove();
    var el = document.createElement("article");
    el.className = "x-result";
    el.innerHTML =
      '<div class="x-result__media" style="aspect-ratio:' + job.aspect.replace(":", " / ") + '">' +
      '<div class="x-progress"><div class="x-scan"></div><div class="x-progress__copy">' +
      '<p class="x-progress__pct">Hatching for real…</p><div class="x-bar"><i style="width:15%"></i></div>' +
      '<p class="x-progress__line">Sending to ' + job.label + "…</p></div></div></div>" +
      '<div class="x-result__body"><p class="x-result__prompt"></p><div class="x-tags"></div>' +
      '<div class="x-result__acts"><a class="x-btn" data-dl aria-disabled="true">Download</a>' +
      '<button class="x-btn" type="button" data-remix>Remix</button></div></div>';
    $(".x-result__prompt", el).textContent = job.text;
    job.tags.forEach(function (t) { var s = document.createElement("span"); s.textContent = t; $(".x-tags", el).appendChild(s); });
    $("[data-remix]", el).addEventListener("click", function () {
      var p = $("#prompt"); p.value = job.text; p.focus();
      $("#creator").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    history.insertBefore(el, history.firstChild);
    return el;
  }

  function setLine(el, text, pct) {
    var line = $(".x-progress__line", el), bar = $(".x-bar i", el);
    if (line) line.textContent = text;
    if (bar && pct != null) bar.style.width = pct + "%";
  }

  function show(el, blob, isVideo, badge, filename) {
    var media = $(".x-result__media", el);
    var url = URL.createObjectURL(blob);
    media.innerHTML = "";
    var node;
    if (isVideo) {
      node = document.createElement("video");
      node.src = url; node.autoplay = true; node.loop = true; node.muted = true; node.playsInline = true; node.controls = true;
    } else {
      node = document.createElement("img");
      node.src = url; node.className = "pb-real"; node.alt = "AI result";
    }
    media.appendChild(node);
    media.insertAdjacentHTML("beforeend", '<span class="x-badge">' + badge + "</span>");
    wireDownload(el, blob, url, filename);
  }

  /* ---------- Download: direct save, plus Save to phone (share sheet) where supported ---------- */
  function stamp() {
    var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + "-" + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds());
  }
  function extFor(blob, fallback) {
    var t = (blob && blob.type) || "";
    if (/png/.test(t)) return "png";
    if (/webp/.test(t)) return "webp";
    if (/jpe?g/.test(t)) return "jpg";
    if (/mp4/.test(t)) return "mp4";
    if (/webm/.test(t)) return "webm";
    return fallback;
  }
  function wireDownload(el, blob, url, filename) {
    var base = filename.replace(/\.[a-z0-9]+$/i, "");
    var name = base + "-" + stamp() + "." + extFor(blob, filename.split(".").pop());
    var dl = $("[data-dl]", el);
    dl.href = url; dl.download = name; dl.removeAttribute("aria-disabled");
    dl.setAttribute("role", "button"); dl.style.cursor = "pointer";
    dl.addEventListener("click", function (ev) {
      ev.preventDefault();
      var a = document.createElement("a");
      a.href = url; a.download = name; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    });
    var file = null;
    try { file = new File([blob], name, { type: blob.type || "application/octet-stream" }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      var sv = document.createElement("button");
      sv.type = "button"; sv.className = "x-btn"; sv.textContent = "Save to phone";
      sv.addEventListener("click", function () {
        navigator.share({ files: [file], title: "Psycho Bug AI" }).catch(function () {});
      });
      dl.parentNode.insertBefore(sv, dl.nextSibling);
    }
    // Also let a tap on the result itself save it.
    var media = $(".x-result__media", el), node = media && media.querySelector("img,video");
    if (node) { node.title = "Tap Download to save"; }
  }

  function fail(el, err) {
    var msg = err && err.status === 402
      ? "Out of Pollen on your Pollinations account. Claim free Quest Pollen at enter.pollinations.ai."
      : (err && err.status === 401 ? "Connection expired. Press Connect again." : "Failed: " + (err && err.message || err));
    setLine(el, msg, 100);
    var pct = $(".x-progress__pct", el); if (pct) pct.textContent = "Hatch failed";
  }

  function runLive() {
    var text = $("#prompt").value.trim();
    var warn = $("#warn");
    if (!text) { warn.textContent = "Feed it first: write a prompt."; $("#prompt").focus(); return; }
    warn.textContent = "";
    var modelSel = $("#model"), m = MAP[modelSel.value];
    var aspect = $("#aspect").value, dur = parseInt($("#duration").value, 10) || 5;
    var sound = $("#sound").value === "on";
    var label = modelSel.options[modelSel.selectedIndex].text.split(" — ")[0];
    var full = buildPrompt(text);
    var tags = [label, m.kind === "video" ? dur + "s" : "Image", aspect, presetName(), "Live"];
    var el = card({ text: text, aspect: aspect, label: label, tags: tags });

    var tab = document.querySelector('[data-view="history"]'); if (tab) tab.click();

    if (m.kind === "image") {
      setLine(el, "Growing pixels…", 45);
      genImage(m.model, full, aspect)
        .then(function (b) { show(el, b, false, "Live · AI image", "psycho-bug.jpg"); })
        .catch(function (e) { fail(el, e); });
      return;
    }

    // Video: real video if the account can pay for it, else a real keyframe with motion.
    var seconds = Math.min(dur, 10);
    setLine(el, "Laying frames in the dark…", 25);
    genVideo(m.model, full, aspect, seconds, sound, function (s) { setLine(el, "Rendering dread… " + s + "s", Math.min(90, 25 + s)); })
      .then(function (b) { show(el, b, true, "Live · AI video", "psycho-bug.mp4"); })
      .catch(function (e) {
        if (e && (e.status === 402 || e.status === 403)) {
          setLine(el, "No paid Pollen for video — hatching a real keyframe instead…", 60);
          return genImage(m.frame, full, aspect).then(function (b) {
            show(el, b, false, "Live · AI keyframe (video needs paid Pollen)", "psycho-bug-keyframe.jpg");
            var img = $(".x-result__media img", el);
            if (img) img.style.animation = "pbKen 12s ease-in-out infinite alternate";
          });
        }
        throw e;
      })
      .catch(function (e) { fail(el, e); });
  }

  var kf = document.createElement("style");
  kf.textContent = "@keyframes pbKen{from{transform:scale(1) translate(0,0)}to{transform:scale(1.12) translate(-2%,-2%)}}";
  document.head.appendChild(kf);

  // Intercept Generate in the capture phase: live mode when connected, otherwise
  // let the original simulated handler run untouched.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("#generate");
    if (!btn || !key) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    runLive();
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountUI);
  else mountUI();
})();
