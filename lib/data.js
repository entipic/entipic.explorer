var external = module.exports;
var Data = require('entipic.data');
var inited = false;

function init() {
  if (inited) return;
  inited = true;

  var connection = Data.connect(process.env.ENTIPIC_CONNECTION);
  var db = Data.Db(connection);
  external.control = new Data.ControlService(db);
  external.access = new Data.AccessService(db);
  external.formatter = Data.formatter;
}

init();
