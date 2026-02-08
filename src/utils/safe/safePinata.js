import { listPrivateFiles, getPrivateFileContent, uploadPrivateFile, deletePrivateFile } from '@/utils/pinata';
import { parseInputValue } from '@/utils/solidity/parseInputValue';
import { encodeFunctionData } from 'viem';
import { EthSafeSignature } from '@safe-global/protocol-kit';

/**
 * Получает pending транзакции из Pinata, фильтрует устаревшие и группирует по nonce
 * 
 * @param {import('@safe-global/protocol-kit').default} safeSDK - Инициализированный Safe SDK
 * @param {string} jwt - JWT токен Pinata
 * @param {string} chainId - ID сети
 * @returns {Promise<{success: boolean, data: Array<{nonce: number, files: any[]}>, error?: Error}>}
 */
export async function pendingTransactions(safeSDK, jwt, chainId) {
  try {
    const safeAddress = await safeSDK.getAddress();
    const currentNonce = await safeSDK.getNonce();
    
    // Получаем список файлов из Pinata
    const files = await listPrivateFiles(
      jwt,
      `${chainId}_`,
      {
        state: 'pending',
        safe: safeAddress
      }
    );
    
    const forDelete = [];
    const validFiles = [];
    
    files.forEach((file) => {
      const fileNonce = Number(file.keyvalues.nonce);
      if (fileNonce < currentNonce) {
        // Файл устарел, добавляем в список на удаление
        if (file.id) {
          forDelete.push(file.id);
        }
      } else {
        // Файл актуален
        validFiles.push(file);
      }
    });
    
    if (forDelete.length > 0) {
      deletePrivateFile(jwt, forDelete).catch(() => {});
    }
    
    // Группируем файлы по nonce
    const groupedByNonce = validFiles.reduce((acc, file) => {
      const nonce = Number(file.keyvalues.nonce);
      (acc[nonce] = acc[nonce] || []).push(file);
      return acc;
    }, {});
    
    const result = Object.entries(groupedByNonce)
      .map(([nonce, files]) => ({
        nonce: Number(nonce),
        files
      }))
      .sort((a, b) => a.nonce - b.nonce);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Создает Safe транзакцию на основе данных формы
 * 
 * @param {import('@safe-global/protocol-kit').default} safeSDK - Инициализированный Safe SDK
 * @param {string} jwt - JWT токен Pinata
 * @param {string} chainId - ID сети
 * @param {Object} formData - Данные формы
 * @param {string} formData.contractAddress - Адрес контракта
 * @param {Object} formData.selectedMethod - Выбранный метод из ABI
 * @param {string} formData.value - Значение для отправки (wei)
 * @param {Array<{value: string, input: Object}>} formData.inputs - Массив входных параметров
 * @returns {Promise<{success: boolean, data?: import('@safe-global/types-kit').SafeTransaction, error?: Error}>}
 */
export async function createSafeTx(safeSDK, jwt, chainId, formData) {
  //try {
    const safeAddress = await safeSDK.getAddress();
    const safeNonce = await safeSDK.getNonce();
    
    let pinataFiles;
    try {
      pinataFiles = await listPrivateFiles(
        jwt,
        `${chainId}_`,
        {
          state: 'pending',
          safe: safeAddress
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
    
    let pinataNonce = -1;
    if (pinataFiles.length > 0) {
      const nonces = pinataFiles.map(file => Number(file.keyvalues.nonce));
      pinataNonce = Math.max(...nonces) + 1;
    }
    
    const finalNonce = Math.max(safeNonce, pinataNonce);
    
    const args = (formData.inputs || []).map(input => 
      parseInputValue(input.input.type, input.value)
    );
    
    const functionData = encodeFunctionData({
      abi: [formData.selectedMethod],
      functionName: formData.selectedMethod.name,
      args: args
    });
    
    const safeTx = await safeSDK.createTransaction({
      transactions: [{
        to: formData.contractAddress,
        value: formData.value || '0',
        data: functionData
      }],
      options: {
        nonce: finalNonce
      }
    });
    
    return {
      success: true,
      data: safeTx
    };
  //} catch (error) {
  //  return {
  //    success: false,
  //    error: error instanceof Error ? error : new Error(String(error))
  //  };
  //}
}

/**
 * Восстанавливает Safe транзакцию из Pinata по CID
 * 
 * @param {import('@safe-global/protocol-kit').default} safeSDK - Инициализированный Safe SDK
 * @param {string} jwt - JWT токен Pinata
 * @param {string} cid - CID файла в Pinata
 * @returns {Promise<{success: boolean, data?: {safeTx: import('@safe-global/types-kit').SafeTransaction, abi?: Object}, error?: Error}>}
 */
export async function getSafeTx(safeSDK, jwt, cid) {
  try {
    const fileContent = await getPrivateFileContent(jwt, cid);
    
    const fileContentData = fileContent.content || fileContent;
    const txData = fileContentData.data || fileContentData;
    
    const abi = fileContentData.abi;
    
    if (!txData || !txData.to || !txData.data || txData.nonce === undefined) {
      return {
        success: false,
        error: new Error('Missing required transaction data. Need: to, data, nonce.')
      };
    }
    
    const transactionParams = {
      to: txData.to,
      value: txData.value || '0',
      data: txData.data || '0x'
    };
    
    if (txData.operation !== undefined) {
      transactionParams.operation = txData.operation;
    }
    
    const safeTx = await safeSDK.createTransaction({
      transactions: [transactionParams],
      options: {
        nonce: Number(txData.nonce)
      }
    });
    
    if (txData.safeTxGas !== undefined) safeTx.data.safeTxGas = txData.safeTxGas;
    if (txData.baseGas !== undefined) safeTx.data.baseGas = txData.baseGas;
    if (txData.gasPrice !== undefined) safeTx.data.gasPrice = txData.gasPrice;
    if (txData.gasToken !== undefined) safeTx.data.gasToken = txData.gasToken;
    if (txData.refundReceiver !== undefined) safeTx.data.refundReceiver = txData.refundReceiver;
    
    return {
      success: true,
      data: {
        safeTx,
        abi
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Загружает подписанную Safe транзакцию в Pinata
 * 
 * @param {import('@safe-global/protocol-kit').default} safeSDK - Инициализированный Safe SDK
 * @param {import('@safe-global/types-kit').SafeTransaction} signedTx - Подписанная транзакция
 * @param {string} jwt - JWT токен Pinata
 * @param {string} chainId - ID сети
 * @param {Object} selectedMethod - Выбранный метод из ABI
 * @returns {Promise<{success: boolean, data?: any, error?: Error}>}
 */
export async function uploadSignedTx(safeSDK, signedTx, jwt, chainId, selectedMethod) {
  try {
    const safeAddress = await safeSDK.getAddress();
    const txHash = await safeSDK.getTransactionHash(signedTx);
    
    const signaturesEntries = Array.from(signedTx.signatures.entries());
    if (signaturesEntries.length === 0) {
      return {
        success: false,
        error: new Error('No signatures found in transaction')
      };
    }
    
    const [signerAddress, signatureValue] = signaturesEntries[0];
    
    const signature = typeof signatureValue === 'string' 
      ? signatureValue 
      : (signatureValue?.data || String(signatureValue));
    
    const contractAddress = signedTx.data.to || '';
    const fileName = `${chainId}_${signedTx.data.nonce}_${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;
    
    const content = {
      data: signedTx.data,
      signature: signature,
      abi: selectedMethod
    };
    
    const metadata = {
      safe: safeAddress,
      nonce: signedTx.data.nonce.toString(),
      txHash: txHash,
      state: 'pending',
      signer: signerAddress,
      signature: signature,
      method: selectedMethod?.name || ''
    };
    
    const uploadResult = await uploadPrivateFile(jwt, content, fileName, metadata);
    
    return {
      success: true,
      data: uploadResult
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Объединяет подписи из группы файлов и возвращает закодированную транзакцию для выполнения
 * 
 * @param {import('@safe-global/protocol-kit').default} safeSDK - Инициализированный Safe SDK
 * @param {import('@safe-global/types-kit').SafeTransaction} safeTx - Safe транзакция
 * @param {Object} group - Группа транзакций с `nonce` и массивом `files`
 * @param {Object} accountData - Данные аккаунта с `account.threshold` и `account.owners`
 * @returns {Promise<{success: boolean, data?: string, error?: Error}>} Закодированные данные транзакции
 */
export async function executeSafeTx(safeSDK, safeTx, group, accountData) {
  try {
    const owners = accountData?.account?.owners || [];
    const threshold = accountData?.account?.threshold || 0;
    
    const signaturesMap = new Map();
    group.files.forEach((file) => {
      const signer = file.keyvalues?.signer?.toLowerCase();
      const signature = file.keyvalues?.signature;
      if (signer && signature && !signaturesMap.has(signer)) {
        signaturesMap.set(signer, signature);
      }
    });
    
    if (signaturesMap.size === 0) {
      return {
        success: false,
        error: new Error('No signatures found in file metadata')
      };
    }
    
    const finalTx = await safeSDK.copyTransaction(safeTx);
    
    Array.from(signaturesMap.entries()).forEach(([signer, signature]) => {
      const owner = owners.find(o => o.toLowerCase() === signer);
      if (owner) {
        const sig = new EthSafeSignature(owner, signature, false);
        finalTx.addSignature(sig);
      }
    });
    
    if (finalTx.signatures.size < threshold) {
      return {
        success: false,
        error: new Error(`Not enough signatures! Required: ${threshold}, Got: ${finalTx.signatures.size}`)
      };
    }
    
    const encodedTx = await safeSDK.getEncodedTransaction(finalTx);
    
    return {
      success: true,
      data: encodedTx
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
