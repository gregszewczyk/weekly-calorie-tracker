 /**
 * React Native Nuclear FormData Fix - Last Resort
 * 
 * This patches FormData without using Node.js modules
 */
console.log('☢️ [RN-NUCLEAR FIX] Loading React Native nuclear FormData fix...');

// Store original constructors
const OriginalFormData = require('form-data');
const OriginalWebFormData = global.FormData;

console.log('☢️ [RN-NUCLEAR FIX] Original FormData types:', {
  node: typeof OriginalFormData,
  web: typeof OriginalWebFormData,
  same: OriginalFormData === OriginalWebFormData
});

// Create bulletproof FormData class
class RNNuclearFormData {
  constructor() {
    console.log('☢️ [RN-NUCLEAR FIX] RNNuclearFormData constructor called');
    this._internal = new OriginalFormData();
  }

  append(name, value, options) {
    console.log('☢️☢️☢️ [RN-NUCLEAR FIX] NUCLEAR APPEND CALLED!', { 
      name, 
      value: typeof value, 
      options,
      optionsType: typeof options 
    });
    
    // ALWAYS ensure filename exists - handle ALL cases
    let safeOptions = options;
    
    if (options === undefined || options === null) {
      safeOptions = { filename: 'file' };
      console.log('☢️ [RN-NUCLEAR FIX] Fixed undefined/null options');
    } else if (typeof options === 'string') {
      safeOptions = { filename: options };
      console.log('☢️ [RN-NUCLEAR FIX] Fixed string options');
    } else if (typeof options === 'object') {
      if (!options.filename) {
        safeOptions = { ...options, filename: 'file' };
        console.log('☢️ [RN-NUCLEAR FIX] Added missing filename to object options');
      }
    } else {
      // Weird case - options is something else
      safeOptions = { filename: 'file' };
      console.log('☢️ [RN-NUCLEAR FIX] Fixed weird options type:', typeof options);
    }
    
    console.log('☢️☢️☢️ [RN-NUCLEAR FIX] Using safe options:', safeOptions);
    
    try {
      const result = this._internal.append(name, value, safeOptions);
      console.log('☢️ [RN-NUCLEAR FIX] Append succeeded');
      return result;
    } catch (error) {
      console.error('☢️ [RN-NUCLEAR FIX] Internal append failed:', error.message);
      // Ultimate fallback
      try {
        return this._internal.append(name, value, { filename: 'file' });
      } catch (fallbackError) {
        console.error('☢️ [RN-NUCLEAR FIX] Even fallback failed:', fallbackError.message);
        throw fallbackError;
      }
    }
  }

  // Proxy all other methods with logging
  getBoundary() { 
    console.log('☢️ [RN-NUCLEAR FIX] getBoundary called');
    return this._internal.getBoundary(); 
  }
  
  getHeaders() { 
    console.log('☢️ [RN-NUCLEAR FIX] getHeaders called');
    return this._internal.getHeaders(); 
  }
  
  toString() { 
    console.log('☢️ [RN-NUCLEAR FIX] toString called');
    return this._internal.toString(); 
  }
  
  getLength(callback) { 
    console.log('☢️ [RN-NUCLEAR FIX] getLength called');
    return this._internal.getLength(callback); 
  }
  
  pipe(stream) { 
    console.log('☢️ [RN-NUCLEAR FIX] pipe called');
    return this._internal.pipe(stream); 
  }
  
  submit(params, callback) { 
    console.log('☢️ [RN-NUCLEAR FIX] submit called');
    return this._internal.submit(params, callback); 
  }
}

// Replace global FormData
console.log('☢️ [RN-NUCLEAR FIX] Replacing global.FormData...');
global.FormData = RNNuclearFormData;

// ALSO patch the original form-data constructor directly
console.log('☢️ [RN-NUCLEAR FIX] Patching original FormData constructor...');
const originalAppend = OriginalFormData.prototype.append;
OriginalFormData.prototype.append = function(name, value, options) {
  console.log('☢️☢️☢️ [RN-NUCLEAR FIX] ORIGINAL FormData.append called!', { name, options });
  
  let safeOptions = options;
  if (options === undefined || options === null) {
    safeOptions = { filename: 'file' };
  } else if (typeof options === 'object' && !options.filename) {
    safeOptions = { ...options, filename: 'file' };
  }
  
  return originalAppend.call(this, name, value, safeOptions);
};

// Test the nuclear fix
try {
  console.log('☢️ [RN-NUCLEAR FIX] Testing nuclear fix...');
  const testForm = new global.FormData();
  testForm.append('test', 'value');
  testForm.append('test2', 'value2', undefined);
  testForm.append('test3', 'value3', null);
  console.log('☢️ [RN-NUCLEAR FIX] Nuclear fix test passed!');
} catch (testError) {
  console.error('☢️ [RN-NUCLEAR FIX] Nuclear fix test failed:', testError.message);
}

console.log('☢️ [RN-NUCLEAR FIX] React Native nuclear fix deployed');

module.exports = RNNuclearFormData;