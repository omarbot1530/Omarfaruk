"use strict";

const utils = require("../utils");
const log = require("npmlog");

function formatData(data) {
  const ret = {};

  for (const id in data) {
    if (Object.prototype.hasOwnProperty.call(data, id)) {
      const u = data[id];

      ret[id] = {
        name: u.name,
        firstName: u.firstName,
        vanity: u.vanity,
        gender: u.gender,
        type: u.type,
        isFriend: u.is_friend,
        isBirthday: !!u.is_birthday,
        profileUrl: u.uri,

        // low quality (fallback)
        thumbSrc: u.thumbSrc || null,

        // ✅ HD avatar (BEST)
        avatar: `https://graph.facebook.com/${id}/picture?width=720&height=720`,
      };
    }
  }
  return ret;
}

module.exports = function (defaultFuncs, api, ctx) {
  return function getUserInfo(id, callback) {
    let resolveFunc, rejectFunc;
    const promise = new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = (err, data) => {
        if (err) rejectFunc(err);
        else resolveFunc(data);
      };
    }

    if (!Array.isArray(id)) id = [id];

    const form = {};
    id.forEach((v, i) => (form[`ids[${i}]`] = v));

    defaultFuncs
      .post("https://www.facebook.com/chat/user_info/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then((res) => {
        if (res.error) throw res;
        callback(null, formatData(res.payload.profiles));
      })
      .catch((err) => {
        log.error("getUserInfo", err);
        callback(err);
      });

    return promise;
  };
};
