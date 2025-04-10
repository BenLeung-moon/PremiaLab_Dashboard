// Test 1: Default import
import axios from 'axios';
console.log('Axios version:', axios.VERSION);

// Test 2: Named imports 
import * as AxiosModule from 'axios';
console.log('Axios module:', AxiosModule);

// Export something to make TypeScript happy
export const testAxios = () => {
  console.log('Testing axios import');
}; 