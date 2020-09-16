import {REPMHTTPInvoker} from './repm-invoker.js';
import Replicache from './replicache.js';

(async () => {
  const invoker = new REPMHTTPInvoker('http://localhost:7002');
  await invoker.invoke('test', 'open');

  const {transactionId} = await invoker.invoke('test', 'openTransaction', {});
  const putResponse = await invoker.invoke('test', 'put', {
    transactionId,
    key: '/v',
    value: 1,
  });
  console.log(putResponse);
  await invoker.invoke('test', 'commitTransaction', {transactionId});

  {
    const {transactionId} = await invoker.invoke('test', 'openTransaction', {});
    const getResponse = await invoker.invoke('test', 'get', {
      transactionId,
      key: '/v',
    });
    console.log(getResponse);
    await invoker.invoke('test', 'closeTransaction', {transactionId});
  }

  {
    const {transactionId} = await invoker.invoke('test', 'openTransaction', {});
    const scanResponse = await invoker.invoke('test', 'scan', {
      transactionId,
    });
    console.log(scanResponse);
    await invoker.invoke('test', 'closeTransaction', {transactionId});
  }

  await invoker.invoke('test', 'close');

  const repmInvoker = invoker;
  document.body.textContent = JSON.stringify(
    await Replicache.list({repmInvoker}),
    null,
    2,
  );

  document.body.textContent += ';\n';

  await Replicache.drop('test', {repmInvoker});

  document.body.textContent += ';\n';
  document.body.textContent += JSON.stringify(
    await Replicache.list({repmInvoker}),
    null,
    2,
  );
})();
