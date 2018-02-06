import Crypto from 'crypto';
import CoinKey from 'coinkey';
import Ecdsa from 'ecdsa';

import { browserHistory } from 'react-router';

export const convertPublicKeyToAddress = publicKey => sha256Hash(publicKey);

export const sha256Hash = data => Crypto.createHash('sha256').update(data).digest();

export const goToPreviousPage = () => browserHistory.goBack();