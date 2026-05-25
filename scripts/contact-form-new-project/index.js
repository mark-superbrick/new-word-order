/**
 * contact-form-new-project — hidden field sync, validation, and fetch submission
 *
 * Handles two forms on the contact page:
 *   #contact-form-new-project — checkboxes, radios, hidden fields, validation
 *   #contact-form-not-sure-yet — basic text fields only
 *
 * Both use fetch-based submission to Webflow's API (required after Barba transitions).
 *
 * Staging CDN:
 *   https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@staging/scripts/contact-form-new-project/index.js
 *
 * Production CDN:
 *   https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@main/scripts/contact-form-new-project/index.js
 */

const CONTACT_FORM_SITE_ID = '69d59dcb21dd62ab1da50444';
const ERROR_COLOR = '#f64c4c';
const SPINNER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 18 17" fill="none" class="u-svg" style="animation:contactSpinner .8s linear infinite"><path d="M18 7.10272L17.4569 5.44886L9.35892 8.59327L9.87841 0H8.12121L8.6407 8.59327L0.543119 5.44886L0 7.10272L8.41873 9.26915L2.89457 15.9191L4.31628 16.9412L8.99981 9.68703L13.6837 16.9412L15.105 15.9191L9.58089 9.26915L18 7.10272Z" fill="currentColor"></path></svg>';

if (!document.querySelector('#contactSpinnerStyle')) {
  var style = document.createElement('style');
  style.id = 'contactSpinnerStyle';
  style.textContent = '@keyframes contactSpinner{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
}

function setupWebflowFormSubmit(form) {
  const wrapper = form.closest('.w-form');
  const successEl = wrapper ? wrapper.querySelector('.w-form-done') : null;
  const failEl = wrapper ? wrapper.querySelector('.w-form-fail') : null;

  if (successEl) {
    const observer = new MutationObserver(function () {
      if (successEl.style.display !== 'none' && successEl.style.display !== '') {
        const top = wrapper.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
    observer.observe(successEl, { attributes: true, attributeFilter: ['style'] });
  }

  function submitFormData() {
    var submitBtn = form.querySelector('[type="submit"]');
    var btnWrapper = submitBtn ? submitBtn.closest('.button') : null;
    var labelDiv = btnWrapper ? btnWrapper.querySelector(':scope > div:not(.clickable_wrap):not(.button_icon)') : null;
    var iconEl = btnWrapper ? btnWrapper.querySelector('.button_icon .u-svg') : null;
    var originalLabel = labelDiv ? labelDiv.textContent : '';
    var originalIconHTML = iconEl ? iconEl.outerHTML : '';
    if (labelDiv) labelDiv.textContent = 'Please wait...';
    if (iconEl) { iconEl.insertAdjacentHTML('afterend', SPINNER_SVG); iconEl.remove(); }
    if (submitBtn) submitBtn.disabled = true;

    const params = new URLSearchParams();

    params.set('name', form.getAttribute('data-name'));
    params.set('pageId', form.getAttribute('data-wf-page-id'));
    params.set('elementId', form.getAttribute('data-wf-element-id'));
    params.set('domain', window.location.host);
    params.set('collectionId', '');
    params.set('itemSlug', '');
    params.set('source', window.location.href);
    params.set('test', 'false');
    params.set('dolphin', 'false');

    form.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]), textarea').forEach(function (el) {
      const fieldName = el.getAttribute('data-name') || el.name;
      if (fieldName) params.set('fields[' + fieldName + ']', el.value);
    });

    const firstCb = form.querySelector('input[type="checkbox"]');
    if (firstCb) {
      const cbName = firstCb.getAttribute('data-name') || firstCb.name;
      params.set('fields[' + cbName + ']', form.querySelector('input[type="checkbox"]:checked') ? 'true' : 'false');
    }

    const firstRadio = form.querySelector('input[type="radio"]');
    if (firstRadio) {
      const radioName = firstRadio.getAttribute('data-name') || firstRadio.name;
      params.set('fields[' + radioName + ']', form.querySelector('input[type="radio"]:checked') ? 'true' : 'false');
    }

    fetch('https://webflow.com/api/v1/form/' + CONTACT_FORM_SITE_ID, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01'
      },
      body: params.toString()
    })
    .then(function (res) {
      if (res.ok) {
        form.style.display = 'none';
        if (successEl) successEl.style.display = 'block';
      } else {
        restoreBtn();
        if (failEl) failEl.style.display = 'block';
      }
    })
    .catch(function () {
      restoreBtn();
      if (failEl) failEl.style.display = 'block';
    });

    function restoreBtn() {
      if (labelDiv) labelDiv.textContent = originalLabel;
      if (submitBtn) submitBtn.disabled = false;
      var spinnerEl = btnWrapper ? btnWrapper.querySelector('.button_icon .u-svg') : null;
      if (spinnerEl && originalIconHTML) { spinnerEl.insertAdjacentHTML('afterend', originalIconHTML); spinnerEl.remove(); }
    }
  }

  return submitFormData;
}

function initContactFormNewProject(scope) {
  scope = scope || document;
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;
  const ENABLE = true;

  if (!ENABLE) return;

  const form = scope.querySelector('#contact-form-new-project');
  if (!form) return;

  const submitFormData = setupWebflowFormSubmit(form);

  const hiddenBrand = form.querySelector('input[name="selected_brand"]');
  const hiddenCreative = form.querySelector('input[name="selected_creative"]');
  const hiddenStrategy = form.querySelector('input[name="selected_strategy"]');
  const hiddenTeam = form.querySelector('input[name="selected_team"]');
  const checkboxes = form.querySelectorAll('input[type="checkbox"]');
  const radios = form.querySelectorAll('input[name="Team-Member"]');

  const categoryMap = {
    Brand: hiddenBrand,
    Creative: hiddenCreative,
    Strategy: hiddenStrategy
  };

  const typeSection = form.querySelector('.contact_select_type');
  const teamSection = form.querySelector('.contact_select_team');

  function updateTypeFields() {
    Object.keys(categoryMap).forEach(function (category) {
      const container = form.querySelector('[data-value="' + category + '"]');
      const field = categoryMap[category];
      if (!container || !field) return;

      const selected = [];
      container.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
        const label = cb.closest('label');
        const span = label ? label.querySelector('.contact_service_checkbox_label') : null;
        if (span) selected.push(span.textContent.trim());
      });
      field.value = selected.join(', ');
    });

    if (typeSection && form.querySelector('.contact_select_type input[type="checkbox"]:checked')) {
      typeSection.style.color = '';
    }
  }

  function updateTeamField() {
    const checked = form.querySelector('input[name="Team-Member"]:checked');
    if (hiddenTeam) {
      hiddenTeam.value = checked ? checked.getAttribute('data-value') : '';
    }

    if (teamSection && checked) {
      teamSection.style.color = '';
    }
  }

  checkboxes.forEach(function (cb) {
    var label = cb.closest('label');
    var customInput = label ? label.querySelector('.w-checkbox-input') : null;
    if (label) {
      label.addEventListener('click', function (e) {
        e.preventDefault();
        cb.checked = !cb.checked;
        if (customInput) customInput.classList.toggle('w--redirected-checked', cb.checked);
        updateTypeFields();
      });
    }
  });

  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      radios.forEach(function (r) {
        const ri = r.closest('label').querySelector('.w-form-formradioinput');
        if (ri) ri.classList.remove('w--redirected-checked');
      });
      const ri = radio.closest('label').querySelector('.w-form-formradioinput');
      if (ri) ri.classList.add('w--redirected-checked');
      updateTeamField();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    const hasType = form.querySelector('.contact_select_type input[type="checkbox"]:checked');
    const hasTeam = form.querySelector('input[name="Team-Member"]:checked');

    if (!hasType || !hasTeam) {
      if (!hasType && typeSection) typeSection.style.color = ERROR_COLOR;
      if (!hasTeam && teamSection) teamSection.style.color = ERROR_COLOR;

      const target = !hasType ? typeSection : teamSection;
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      return;
    }

    submitFormData();
  }, true);

  if (DEBUG) console.log('[contact-form-new-project] initialized');
}

function initContactFormNotSureYet(scope) {
  scope = scope || document;
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;

  const form = scope.querySelector('#contact-form-not-sure-yet');
  if (!form) return;

  const submitFormData = setupWebflowFormSubmit(form);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    submitFormData();
  }, true);

  if (DEBUG) console.log('[contact-form-not-sure-yet] initialized');
}

window.initContactFormNewProject = initContactFormNewProject;
window.initContactFormNotSureYet = initContactFormNotSureYet;
