/**
 * contact-form-new-project — hidden field sync + validation for contact form
 *
 * Usage in Webflow:
 *   Form must have id="contact-form-new-project".
 *   Add hidden inputs named: selected_brand, selected_creative, selected_strategy, selected_team.
 *   Checkboxes grouped under [data-value="Brand|Creative|Strategy"] containers.
 *   Radios with name="Team-Member" and data-value="<team member name>".
 *
 * Staging CDN:
 *   https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@staging/scripts/contact-form-new-project/index.js
 *
 * Production CDN:
 *   https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@main/scripts/contact-form-new-project/index.js
 */

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

  const wrapper = form.closest('.w-form');
  const successEl = wrapper ? wrapper.querySelector('.w-form-done') : null;

  if (successEl) {
    const observer = new MutationObserver(function () {
      if (successEl.style.display !== 'none' && successEl.style.display !== '') {
        const top = wrapper.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
    observer.observe(successEl, { attributes: true, attributeFilter: ['style'] });
  }

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
    const hasType = form.querySelector('.contact_select_type input[type="checkbox"]:checked');
    const hasTeam = form.querySelector('input[name="Team-Member"]:checked');

    if (!hasType || !hasTeam) {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (!hasType && typeSection) typeSection.style.color = '#f64c4c';
      if (!hasTeam && teamSection) teamSection.style.color = '#f64c4c';

      const target = !hasType ? typeSection : teamSection;
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }
  }, true);

  if (DEBUG) console.log('[contact-form-new-project] initialized');
}

window.initContactFormNewProject = initContactFormNewProject;
