// Test-only guard: fail fast if a Node build process tries to open an outbound connection.
import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';
import { syncBuiltinESMExports } from 'node:module';
const deny = () => { throw new Error('Network access attempted during offline build verification'); };
net.Socket.prototype.connect = deny;
tls.connect = deny;
http.request = http.get = https.request = https.get = deny;
globalThis.fetch = deny;
syncBuiltinESMExports();
