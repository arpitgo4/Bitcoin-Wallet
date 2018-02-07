import Crypto from 'crypto';
import CoinKey from 'coinkey';
import Ecdsa from 'ecdsa';
import ripemd160 from 'ripemd160';

import { browserHistory } from 'react-router';

export const convertPublicKeyToAddress = publicKey => ripemd160(
                                sha256Hash(publicKey).toString('hex')
                            ).toString('hex');

// by default keys are stored in Coinkey as Buffers
export const convertPrivateKeyToPublicKey = privateKey => 
                    new CoinKey(Buffer.from(privateKey, 'hex')).publicKey.toString('hex');

export const convertPrivateKeyToAddress = privateKey => 
                    new CoinKey(Buffer.from(privateKey, 'hex')).publicAddress;
 
export const sha256Hash = data => Crypto.createHash('sha256').update(data).digest();

export const goToPreviousPage = () => browserHistory.goBack();