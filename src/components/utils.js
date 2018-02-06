import Crypto from 'crypto';
import CoinKey from 'coinkey';
import Ecdsa from 'ecdsa';

export const convertPublicKeyToAddress = publicKey => sha256Hash(publicKey);

export const sha256Hash = data => Crypto.createHash('sha256').update(data).digest();