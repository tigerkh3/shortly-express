const parseCookies = (req, res, next) => {

  // USE PROMISES

  // create cookie string
  var cookieString = req.headers.cookie;

  if (cookieString === undefined) {
    req.cookies = {};

  } else {
    // create cookies object
    var cookies = {};

    // split the string on a '; '
    var cookieJar = cookieString.split('; ');

    // iterate through the resulting array
    for (var cookie of cookieJar) {
      // split each string on =
      var currentCookie = cookie.split('=');
      // assign key value pairs to cookies object
      cookies[currentCookie[0]] = currentCookie[1];
    }
    // assign cookies object to request
    req['cookies'] = cookies;
  }
  next();
};

module.exports = parseCookies;