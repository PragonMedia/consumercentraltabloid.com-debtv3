// Track if Ringba is already loaded
let ringbaLoaded = false;

// Load Ringba function - exactly as provided but as JavaScript function
const loadRingba = (shouldAddTags = true) => {
  // If Ringba is already loaded, just add tags if needed
  if (ringbaLoaded) {
    if (shouldAddTags) {
      addRingbaTags();
    }
    return;
  }

  var script = document.createElement("script");
  script.src = "//b-js.ringba.com/CA2c51225417964aa3acf7ef3a0c2fc631";
  
  if (shouldAddTags) {
    let timeoutId = setTimeout(addRingbaTags, 1000);
    script.onload = function () {
      clearTimeout(timeoutId);
      addRingbaTags();
      ringbaLoaded = true;
    };
  } else {
    script.onload = function () {
      ringbaLoaded = true;
      console.log("Ringba preloaded successfully");
    };
  }
  
  document.head.appendChild(script);
};

// Function to add tags - with amount parameter and gtg added
function addRingbaTags() {
  let qualifiedValue =
    new URL(window.location.href).searchParams.get("qualified") || "unknown";
  let debtValue =
    new URL(window.location.href).searchParams.get("amount") || "unknown";

  // Get gtg value from localStorage (set by gtg analysis script)
  let gtgValue = localStorage.getItem("gtg");

  // Initialize rgba_tags array if it doesn't exist
  window._rgba_tags = window._rgba_tags || [];

  // Push individual tags as separate objects
  window._rgba_tags.push({ type: "RT" });
  window._rgba_tags.push({ track_attempted: "yes" });
  window._rgba_tags.push({ qualified: qualifiedValue });
  window._rgba_tags.push({ debt: debtValue });

  // Only add gtg parameter if it exists (not null/undefined)
  if (gtgValue !== null && gtgValue !== undefined && gtgValue !== "null") {
    window._rgba_tags.push({ gtg: gtgValue });
  }

  console.log("Sending initial tags to Ringba:", {
    type: "RT",
    track_attempted: "yes",
    qualified: qualifiedValue,
    debt: debtValue,
    gtg: gtgValue,
  });

  var intervalId = setInterval(() => {
    if (window.testData && window.testData.rtkcid !== undefined) {
      // Push click-related tags
      window._rgba_tags.push({ clickid: window.testData.rtkcid });
      window._rgba_tags.push({ qualified: qualifiedValue });
      window._rgba_tags.push({ debt: debtValue });

      // Only add gtg parameter if it exists (not null/undefined)
      if (gtgValue !== null && gtgValue !== undefined && gtgValue !== "null") {
        window._rgba_tags.push({ gtg: gtgValue });
      }

      console.log("Sending click tags to Ringba:", {
        clickid: window.testData.rtkcid,
        qualified: qualifiedValue,
        debt: debtValue,
        gtg: gtgValue,
      });
      clearInterval(intervalId);
    }
  }, 500);
}

function startCountdown() {
  var timeLeft = 30;
  var countdownElement = document.getElementById("countdown");
  var countdownInterval = setInterval(function () {
    var minutes = Math.floor(timeLeft / 60);
    var seconds = timeLeft % 60;
    var formattedTime =
      (minutes < 10 ? "0" : "") +
      minutes +
      ":" +
      (seconds < 10 ? "0" : "") +
      seconds;
    countdownElement.innerHTML = formattedTime;
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
    }
    timeLeft--;
  }, 1000);
}

function loadImages() {
  let images = document.querySelectorAll(".lazyloading");
  images.forEach((image) => {
    if (image.dataset.src) {
      image.src = image.dataset.src;
    }
  });
}

let speed = 500;

function updateAgeGroup(ageGroup) {
  let url = new URL(window.location.href);
  url.searchParams.delete("u65consumer");
  url.searchParams.delete("o65consumer");
  if (ageGroup === "under65") {
    url.searchParams.set("u65consumer", "true");
  } else if (ageGroup === "over65") {
    url.searchParams.set("o65consumer", "true");
  }
  window.history.replaceState({}, "", url);
}

let is_below = false;
let is_between = false;
let is_71plus = false;

loadImages();

// Progress management
const progressMap = {
  age: 0,
  medicare: 50,
  result: 100,
};

function setProgress(key) {
  const pct = progressMap[key] ?? 0;
  document.getElementById("flowMeter").value = pct;
  $("#progressLabel").text(pct + "% Complete");
  $("#bar")
    .css("width", pct + "%")
    .attr("aria-valuenow", String(pct));
}

function switchStage(id, key) {
  $(".ux-stage.is-visible").removeClass("is-visible");
  $("#" + id).addClass("is-visible");
  setProgress(key);
}

var buttonValue;
var currentStep;

// Form step handling - adapted from chatbot to multi-step form
$("button[data-goto]").on("click", function () {
  currentStep = $(this).attr("data-form-step");
  buttonValue = $(this).attr("data-form-value");
  const nextStage = $(this).attr("data-goto");

  console.log("Button clicked:", { currentStep, buttonValue, nextStage });

  if (currentStep == 2) {
    //  selection
    var newUrl = new URL(window.location.href);

    if (buttonValue == "under_10k") {
      newUrl.searchParams.delete("amount");
      newUrl.searchParams.set("amount", "10");
      updateAgeGroup("under65");
      is_below = true;
    } else if (buttonValue == "10k_15k") {
      newUrl.searchParams.delete("amount");
      newUrl.searchParams.set("amount", "15");
      updateAgeGroup("over65");
      is_between = true;
    } else if (buttonValue == "15k_20k") {
      newUrl.searchParams.delete("amount");
      newUrl.searchParams.set("amount", "20");
      updateAgeGroup("over65");
      is_71plus = true;
    } else if (buttonValue == "over_20k") {
      newUrl.searchParams.delete("amount");
      newUrl.searchParams.set("amount", "25");
      updateAgeGroup("over65");
      is_71plus = true;
    }

    // Update the URL with the new parameter
    window.history.replaceState({}, "", newUrl);

    // Go to Medicare question
    switchStage("stage-medicare", "medicare");
  }

  if (currentStep == 3) {
    // Medicare A&B question
    var newUrl = new URL(window.location.href);

    if (buttonValue == "Yes") {
      newUrl.searchParams.delete("qualified");
      newUrl.searchParams.set("qualified", "yes");
    } else if (buttonValue == "No") {
      newUrl.searchParams.delete("qualified");
      newUrl.searchParams.set("qualified", "no");
    }

    // Update the URL with the new qualified parameter
    window.history.replaceState({}, "", newUrl);

    // Show results section first
    showResults();

    // Add/update Ringba tags with final values - Ringba should already be loaded
    // The href has already been set from number.php on page load
    // Ringba DNI will replace it with their pool number
    addRingbaTags();

    // Start polling for Ringba DNI replacement
    // showRingbaNumber will wait until Ringba actually replaces the number
    // Since Ringba is preloaded, this should be much faster
    if (typeof window.showRingbaNumber === "function") {
      window.showRingbaNumber();
    }
  }
});

function showResults() {
  // Always show qualified message regardless of Medicare answer
  let isQualified = true;

  // Change title for step 3
  const formTitle = document.getElementById("form-title");
  if (formTitle) {
    formTitle.textContent = "Congratulations You Qualify For Relief!";
  }

  // Everyone qualifies now - show the qualified message
  $("#qualified-section").show();
  $("#disqualified-section").hide();
  startCountdown();

  switchStage("stage-result", "result");

  // Initialize loader immediately (show loader, hide phone text)
  // This happens while Ringba DNI is processing
  if (typeof window.initializePhoneLoader === "function") {
    window.initializePhoneLoader();
  }
}

function scrollToBottom() {
  var object = $("main");
  $("html, body").animate(
    {
      scrollTop:
        object.offset().top + object.outerHeight() - $(window).height(),
    },
    "fast"
  );
}

function typingEffect() {
  string =
    '<div class="temp-typing bg-gray-200 p-3 rounded-lg shadow-xs mt-2 inline-block">';
  string += '<div class="typing-animation">';
  string += '<div class="typing-dot"></div>';
  string += '<div class="typing-dot"></div>';
  string += '<div class="typing-dot"></div>';
  string += "</div>";
  string += "</div>";
  return string;
}

let userId = localStorage.getItem("user_id");
if (!userId) {
  userId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem("user_id", userId);
}

// Removed: setupQualifyButtons and setupTopChoiceButton functions
// These were for the offer wall which has been removed

// Google Tag Manager Conversion Tracking
let conversionHandlerAttached = false;

function gtag_report_conversion(url) {
  console.log("Google Tag Manager conversion fired");
  var callback = function () {
    if (typeof url != "undefined") {
      window.location = url;
    }
  };
  gtag("event", "conversion", {
    send_to: "AW-16595177166/bhV_CM6I3sAbEM6dmek9",
    value: 1.0,
    currency: "USD",
    event_callback: callback,
  });
  return false;
}

// Add click handler to phone number
function setupPhoneNumberConversion() {
  // Prevent multiple event listeners
  if (conversionHandlerAttached) {
    return;
  }

  const phoneElement = document.getElementById("phone-number");

  if (phoneElement) {
    phoneElement.addEventListener("click", function (e) {
      // Check if qualified=no in URL - if so, don't fire conversion
      const urlParams = new URLSearchParams(window.location.search);
      const qualified = urlParams.get("qualified");

      if (qualified === "no") {
        return; // Don't fire conversion
      }

      // Fire conversion
      const phoneHref = phoneElement.getAttribute("href");
      gtag_report_conversion(phoneHref);
    });
    conversionHandlerAttached = true;
    console.log("Phone number conversion handler attached");
  }
}

// Try to set up phone number conversion handler
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupPhoneNumberConversion);
} else {
  setupPhoneNumberConversion();
}

// Also try after page load and with delays to catch dynamically added elements
window.addEventListener("load", function () {
  setTimeout(setupPhoneNumberConversion, 100);
});

setTimeout(setupPhoneNumberConversion, 500);
setTimeout(setupPhoneNumberConversion, 1000);
setTimeout(setupPhoneNumberConversion, 2000);

// Preload Ringba on page load (without adding tags yet - tags will be added when step 3 is reached)
// This ensures Ringba is ready when user reaches step 3, eliminating the loading delay
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    loadRingba(false); // Load Ringba but don't add tags yet
  });
} else {
  loadRingba(false); // Load Ringba but don't add tags yet
}
