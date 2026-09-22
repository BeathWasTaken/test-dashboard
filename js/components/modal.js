export function openModal({ title, content, footer, onClose, size = '', footerCenter = false }) {

  const root = document.getElementById('modal-root');

  root.innerHTML = '';



  const backdrop = document.createElement('div');

  backdrop.className = 'modal-backdrop';

  backdrop.setAttribute('role', 'dialog');

  backdrop.setAttribute('aria-modal', 'true');

  backdrop.setAttribute('aria-label', title);



  const modal = document.createElement('div');

  modal.className = `modal${size ? ` modal--${size}` : ''}`;

  modal.innerHTML = `

    <div class="modal__header">

      <h2 class="modal__title">${title}</h2>

      <button class="btn-icon modal__close" aria-label="Tutup dialog">

        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>

      </button>

    </div>

    <div class="modal__body">${content}</div>

    ${footer ? `<div class="modal__footer${footerCenter ? ' modal__footer--center' : ''}">${footer}</div>` : ''}

  `;



  backdrop.appendChild(modal);

  root.appendChild(backdrop);



  const close = () => {

    backdrop.style.animation = 'fadeIn 0.2s ease reverse';

    setTimeout(() => {

      root.innerHTML = '';

      if (onClose) onClose();

    }, 200);

  };



  backdrop.querySelector('.modal__close').addEventListener('click', close);

  backdrop.addEventListener('click', (e) => {

    if (e.target === backdrop) close();

  });



  const handleKey = (e) => {

    if (e.key === 'Escape') {

      close();

      document.removeEventListener('keydown', handleKey);

    }

  };

  document.addEventListener('keydown', handleKey);



  const firstInput = modal.querySelector('input, select, textarea, button');

  if (firstInput) firstInput.focus();



  return { close, modal, backdrop };

}



/**

 * Custom confirmation dialog — replaces window.confirm()

 */

export function confirmDialog({

  title = 'Konfirmasi',

  message,

  detail,

  confirmText = 'Ya, Lanjutkan',

  cancelText = 'Batal',

  variant = 'danger',

  icon

}) {

  const icons = {

    danger: '🗑️',

    warning: '⚠️',

    info: 'ℹ️',

    success: '✓'

  };



  const content = `

    <div class="confirm-dialog">

      <div class="confirm-dialog__icon confirm-dialog__icon--${variant}">

        ${icon || icons[variant] || icons.warning}

      </div>

      <p class="confirm-dialog__message">${message}</p>

      ${detail ? `<p class="confirm-dialog__detail">${detail}</p>` : ''}

    </div>

  `;



  const footer = `

    <button type="button" class="btn btn-secondary confirm-dialog__cancel">${cancelText}</button>

    <button type="button" class="btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'} confirm-dialog__confirm">${confirmText}</button>

  `;



  return new Promise((resolve) => {

    const { close, modal } = openModal({ title, content, footer, size: 'sm', footerCenter: true });



    const finish = (result) => {

      close();

      resolve(result);

    };



    modal.querySelector('.confirm-dialog__cancel').addEventListener('click', () => finish(false));

    modal.querySelector('.confirm-dialog__confirm').addEventListener('click', () => finish(true));

  });

}

