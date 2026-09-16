/**
 * Lightweight hash-based router.
 *
 * Routes are kept in the URL hash so that refreshing the browser keeps the
 * user on the same page (no more bouncing back to the Contacts list).
 *
 * Supported routes:
 *   #/contacts        -> CRM Contacts dashboard
 *   #/contact/:id     -> single Lead/Contact detail page
 *   #/sites           -> Sites / Forms dashboard (standalone page)
 *   #/settings        -> Settings page (standalone page, own sidebar)
 *   #/dashboard       -> Dealer / Franchise dashboard (owner vs user views)
 *   #/invoices        -> Yadea Sales Tax Invoice generator
 */

export type Route =
  | { name: 'contacts' }
  | { name: 'contact'; id: number }
  | { name: 'sites' }
  | { name: 'settings' }
  | { name: 'smart-lists' }
  | { name: 'dashboard' }
  | { name: 'automation' }
  | { name: 'invoices' }
  | { name: 'dealership-portal' }
  | { name: 'inquiries-portal' }
  | { name: 'dealership-form' }
  | { name: 'inquiry-form' }
  | { name: 'magic-login'; token: string }
  | { name: 'form'; data: string }
  | { name: 'form-id'; id: number };

export const DEFAULT_ROUTE: Route = { name: 'dashboard' };

export function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '');
  const parts = raw.split('/').filter((p) => p !== '');
  if (parts.length === 0) return DEFAULT_ROUTE;

  const [resource, idPart] = parts;

  if (resource === 'contact') {
    const id = Number(idPart);
    if (Number.isInteger(id) && id > 0) return { name: 'contact', id };
    return DEFAULT_ROUTE;
  }

  switch (resource) {
    case 'contacts':
    case 'leads':
      return { name: 'contacts' };
    case 'sites':
      return { name: 'sites' };
    case 'settings':
      return { name: 'settings' };
    case 'smart-lists':
      return { name: 'smart-lists' };
    case 'dashboard':
      return { name: 'dashboard' };
    case 'automation':
      return { name: 'automation' };
    case 'invoices':
      return { name: 'invoices' };
    case 'dealership-portal':
      return { name: 'dealership-portal' };
    case 'inquiries-portal':
      return { name: 'inquiries-portal' };
    case 'dealership-form':
      return { name: 'dealership-form' };
    case 'inquiry-form':
      return { name: 'inquiry-form' };
    case 'magic-login':
      if (idPart) return { name: 'magic-login', token: decodeURIComponent(idPart) };
      return DEFAULT_ROUTE;
    case 'f':
    case 'form-id': {
      const fid = Number(idPart);
      if (Number.isInteger(fid) && fid > 0) return { name: 'form-id', id: fid };
      return DEFAULT_ROUTE;
    }
    case 'form':
      if (idPart) return { name: 'form', data: idPart };
      return DEFAULT_ROUTE;
    default:
      return DEFAULT_ROUTE;
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'contact':
      return `#/contact/${route.id}`;
    case 'sites':
      return '#/sites';
    case 'settings':
      return '#/settings';
    case 'smart-lists':
      return '#/smart-lists';
    case 'dashboard':
      return '#/dashboard';
    case 'automation':
      return '#/automation';
    case 'invoices':
      return '#/invoices';
    case 'dealership-portal':
      return '#/dealership-portal';
    case 'inquiries-portal':
      return '#/inquiries-portal';
    case 'dealership-form':
      return '#/dealership-form';
    case 'inquiry-form':
      return '#/inquiry-form';
    case 'magic-login':
      return `#/magic-login/${encodeURIComponent(route.token)}`;
    case 'form-id':
      return `#/f/${route.id}`;
    case 'form':
      return `#/form/${route.data}`;
    case 'contacts':
    default:
      return '#/contacts';
  }
}

export function navigate(route: Route): void {
  const hash = routeToHash(route);
  if (window.location.hash === hash) return;
  window.location.hash = hash;
}

/** Subscribe to hash changes; returns an unsubscribe function. */
export function onHashChange(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}