export const isURL = (input: string): boolean => {
  const pattern = /^(?:\w+:)?\/\/([^\s.]+\.\S{2}|localhost[:?\d]*)\S*$/;

  if (pattern.test(input)) {
    return true;
  }
  return pattern.test(`http://${input}`);
};

export const getDomain = (url: string): string => {
  let hostname = url;

  if (hostname.includes('http://') || hostname.includes('https://')) {
    hostname = hostname.split('://')[1];
  }

  if (hostname.includes('?')) {
    hostname = hostname.split('?')[0];
  }

  if (hostname.includes('://')) {
    hostname = `${hostname.split('://')[0]}://${hostname.split('/')[2]}`;
  } else {
    hostname = hostname.split('/')[0];
  }

  return hostname;
};

export const prefixHttp = (url: string): string => {
  url = url.trim();
  return url.includes('://') ? url : `http://${url}`;
};
