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
        if (failEl) failEl.style.display = 'block';
      }
    })
    .catch(function () {
      if (failEl) failEl.style.display = 'block';
    });
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
    cb.addEventListener('change', function () {
      const customInput = cb.closest('label').querySelector('.w-checkbox-input');
      if (customInput) customInput.classList.toggle('w--redirected-checked', cb.checked);
      updateTypeFields();
    });
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
      if (!hasType && typeSection) typeSection.style.color = '#f64c4c';
      if (!hasTeam && teamSection) teamSection.style.color = '#f64c4c';

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
