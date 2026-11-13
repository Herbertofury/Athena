// Only for identity-preserving validation: the caller already owns every record.
// This is not a transport substitute for worker transformations or new data.
export function acceptVerifiedInput(receipt,prepared,count,bytes) {
 if(!receipt||receipt.complete!==true||receipt.algorithm!=='bounded-complete-v1'||receipt.count!==count||receipt.metadata_bytes_per_record!==bytes||receipt.serialized_bytes!==prepared.dataset.serialized_bytes||receipt.sha256!==prepared.dataset.sha256)throw new Error('Worker receipt does not bind the complete requested dataset');
 if(!Number.isSafeInteger(receipt.count)||!Number.isSafeInteger(receipt.metadata_bytes_per_record)||!Number.isSafeInteger(receipt.serialized_bytes)||typeof receipt.sha256!=='string'||!/^[a-f0-9]{64}$/.test(receipt.sha256))throw new Error('Invalid complete-input receipt types');
 return prepared;
}
