import {resolver} from './resolver.js';

export class Lock {
  private _lockP: Promise<unknown> | null = null;

  async lock(): Promise<() => void> {
    const previous = this._lockP;
    const {promise, resolve} = resolver();
    this._lockP = promise;
    await previous;
    return resolve;
  }

  run<R>(f: () => R | Promise<R>): Promise<R> {
    return run(this.lock(), f);
  }
}

export class RWLock {
  private _lock = new Lock();
  private _writeP: Promise<unknown> | null = null;
  private _readP: Promise<unknown>[] = [];

  read(): Promise<() => void> {
    return this._lock.run(async () => {
      await this._writeP;
      const {promise, resolve} = resolver();
      this._readP.push(promise);
      return resolve;
    });
  }

  runRead<R>(f: () => R | Promise<R>): Promise<R> {
    return run(this.read(), f);
  }

  async write(): Promise<() => void> {
    return await this._lock.run(async () => {
      await this._writeP;
      await Promise.all(this._readP);
      const {promise, resolve} = resolver();
      this._writeP = promise;
      this._readP = [];
      return resolve;
    });
  }

  runWrite<R>(f: () => R | Promise<R>): Promise<R> {
    return run(this.write(), f);
  }
}

async function run<R>(
  p: Promise<() => void>,
  f: () => R | Promise<R>,
): Promise<R> {
  const release = await p;
  try {
    return await f();
  } finally {
    release();
  }
}
