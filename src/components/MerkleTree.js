import Crypto from 'crypto';

function createMerkleTree(txList, low, high) {
    if(high-low != 2) {
        const mid = (low + high) / 2;
        createMerkleTree(txList, low, mid);
        createMerkleTree(txList, mid+1, high);
        
    } else {
        
    }
}