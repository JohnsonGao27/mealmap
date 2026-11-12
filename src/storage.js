function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mealmap', 1)
    let blocked = false

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('records')) {
        database.createObjectStore('records', { keyPath: 'id' })
      }
    }

    request.onsuccess = () => {
      const database = request.result
      if (blocked) {
        database.close()
        return
      }
      database.onversionchange = () => database.close()
      resolve(database)
    }

    request.onerror = () => reject(request.error)
    request.onblocked = () => {
      blocked = true
      reject(new Error('Records are open in another tab.'))
    }
  })
}

async function withRecords(mode, operation) {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction('records', mode)
      const request = operation(transaction.objectStore('records'))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error ?? new Error('The record operation did not complete.'))
    })
  } finally {
    database.close()
  }
}

export function readRecords() {
  return withRecords('readonly', (records) => records.getAll())
}

export async function saveRecord(record) {
  await withRecords('readwrite', (records) => records.put(record))
}

export async function deleteRecord(id) {
  await withRecords('readwrite', (records) => records.delete(id))
}
