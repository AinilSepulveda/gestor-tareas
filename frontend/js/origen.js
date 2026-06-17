(() => {
  const { protocol, hostname, port, pathname, search, hash } = window.location;

  if ((protocol === 'http:' || protocol === 'https:') && hostname === '127.0.0.1') {
    window.location.replace(`${protocol}//localhost:${port}${pathname}${search}${hash}`);
  }
})();
