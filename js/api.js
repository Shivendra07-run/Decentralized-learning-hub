/**
 * AETHER API CLIENT HELPER (Zero-Dependency IIFE)
 * Provides unified GET and POST calls with a strict 4-second timeout,
 * automatic Bearer JWT injection, resilient offline fallback, and
 * live connectivity status tracking. Never throws uncaught errors.
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  var inMemoryToken = null;
  var isOnlineState = false;

  function getToken() {
    if (inMemoryToken) return inMemoryToken;
    try {
      inMemoryToken = sessionStorage.getItem('aether_jwt_token');
    } catch (e) {
      inMemoryToken = null;
    }
    return inMemoryToken;
  }

  function setToken(token) {
    inMemoryToken = token || null;
    try {
      if (token) {
        sessionStorage.setItem('aether_jwt_token', token);
      } else {
        sessionStorage.removeItem('aether_jwt_token');
      }
    } catch (e) {
      // Storage unavailable or disabled
    }
  }

  function getBaseUrl() {
    var config = window.Aether.config || {};
    var base = config.API_BASE || '';
    return base.replace(/\/+$/, '');
  }

  async function request(path, options) {
    options = options || {};
    var base = getBaseUrl();
    if (!base || base.indexOf('YOUR-API') !== -1) {
      // Backend not yet deployed or configured
      isOnlineState = false;
      return { ok: false, error: 'API_BASE not configured' };
    }

    var cleanPath = path.charAt(0) === '/' ? path : '/' + path;
    var url = base + cleanPath;

    var controller;
    var timeoutId;
    if (typeof AbortController !== 'undefined') {
      controller = new AbortController();
      timeoutId = setTimeout(function () {
        controller.abort();
      }, 4000); // 4-second strict timeout
    }

    var headers = options.headers || {};
    var token = getToken();
    if (token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    var fetchOpts = {
      method: options.method || 'GET',
      headers: headers,
      signal: controller ? controller.signal : undefined
    };

    if (options.body) {
      if (typeof options.body === 'object' && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        fetchOpts.body = JSON.stringify(options.body);
      } else {
        fetchOpts.body = options.body;
      }
    }

    try {
      var response = await fetch(url, fetchOpts);
      if (timeoutId) clearTimeout(timeoutId);

      var contentType = response.headers.get('content-type') || '';
      var isJson = contentType.indexOf('application/json') !== -1;
      var responseData = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        return {
          ok: false,
          error: (responseData && responseData.error) || 'HTTP ' + response.status
        };
      }

      isOnlineState = true;
      return { ok: true, data: responseData };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      isOnlineState = false;
      var isTimeout = err && (err.name === 'AbortError' || err.message === 'The user aborted a request.');
      return {
        ok: false,
        error: isTimeout ? 'Request timed out (4s)' : (err && err.message ? err.message : 'Network error')
      };
    }
  }

  async function get(path) {
    return request(path, { method: 'GET' });
  }

  async function post(path, body) {
    return request(path, { method: 'POST', body: body });
  }

  async function checkHealth() {
    var res = await get('/api/health');
    isOnlineState = Boolean(res && res.ok);
    return isOnlineState;
  }

  function isOnline() {
    return isOnlineState;
  }

  window.Aether.api = {
    get: get,
    post: post,
    getToken: getToken,
    setToken: setToken,
    checkHealth: checkHealth,
    isOnline: isOnline
  };
})();
