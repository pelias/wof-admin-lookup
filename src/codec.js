const { Packr } = require('msgpackr');
const packr = new Packr({});

function encodeRequest(req) {
  const encoded = packr.pack(req);
  return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
}

function decodeRequest(buf) {
  return packr.unpack(buf);
}

function encodeResponse(res) {
  const encoded = packr.pack(res);
  return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
}

function decodeResponse(buf) {
  return packr.unpack(buf);
}

module.exports = {
  encodeRequest,
  decodeRequest,
  encodeResponse,
  decodeResponse
};