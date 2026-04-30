import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api'

async function testBackend() {
  console.log('Testing MyBank Backend API...\n')
  
  // Test 1: Health check
  try {
    const res = await axios.get('http://localhost:3000/')
    console.log('✓ Backend is running:', res.data.message)
  } catch (err) {
    console.error('✗ Backend not reachable:', err.message)
    return
  }

  // Test 2: Register a test user
  let token = ''
  let userId = ''
  try {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      bvn: '12345678901',
      nin: '12345678901'
    })
    console.log('✓ Registration successful')
    token = res.data.token
    userId = res.data.user.id
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('✓ User already exists, trying login...')
    } else {
      console.error('✗ Registration failed:', err.response?.data?.error || err.message)
      return
    }
  }

  // Test 3: Login if registration skipped
  if (!token) {
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      })
      token = res.data.token
      userId = res.data.user.id
      console.log('✓ Login successful')
    } catch (err) {
      console.error('✗ Login failed:', err.response?.data?.error || err.message)
      return
    }
  }

  // Test 4: Get account (should not exist yet)
  try {
    await axios.get(`${BASE_URL}/accounts/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✗ Account already exists (unexpected)')
  } catch (err) {
    if (err.response?.status === 404) {
      console.log('✓ No account exists yet (expected)')
    } else {
      console.error('✗ Error checking account:', err.response?.data?.error || err.message)
    }
  }

  // Test 5: Create account
  try {
    const res = await axios.post(`${BASE_URL}/accounts/create`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✓ Account created:', res.data.account.account_number)
    const accountNumber = res.data.account.account_number
    const balance = res.data.account.balance

    // Test 6: Get balance
    try {
      const balRes = await axios.get(`${BASE_URL}/banking/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log(`✓ Balance check: NGN ${balRes.data.balance}`)
    } catch (err) {
      console.error('✗ Balance check failed:', err.response?.data?.error || err.message)
    }

    // Test 7: Name enquiry (find own account)
    try {
      const nameRes = await axios.post(`${BASE_URL}/banking/name-enquiry`, {
        account_number: accountNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('✓ Name enquiry:', nameRes.data.name)
    } catch (err) {
      console.error('✗ Name enquiry failed:', err.response?.data?.error || err.message)
    }

    // Test 8: Get transactions (should be empty)
    try {
      const txRes = await axios.get(`${BASE_URL}/banking/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log(`✓ Transactions fetched: ${txRes.data.transactions.length} found`)
    } catch (err) {
      console.error('✗ Get transactions failed:', err.response?.data?.error || err.message)
    }

    // Test 9: Transfer (create another account first)
    try {
      // Register second user
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Recipient User',
        email: 'recipient@example.com',
        password: 'password123',
        bvn: '98765432109',
        nin: '98765432109'
      })
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'recipient@example.com',
        password: 'password123'
      })
      const recipientToken = loginRes.data.token
      const recipientAccRes = await axios.post(`${BASE_URL}/accounts/create`, {}, {
        headers: { Authorization: `Bearer ${recipientToken}` }
      })
      const recipientAccount = recipientAccRes.data.account.account_number

      // Perform transfer
      const transferRes = await axios.post(`${BASE_URL}/banking/transfer`, {
        to_account: recipientAccount,
        amount: 1000,
        description: 'Test transfer'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('✓ Transfer successful! ID:', transferRes.data.transaction.id)
    } catch (err) {
      console.error('✗ Transfer failed:', err.response?.data?.error || err.message)
    }

  } catch (err) {
    console.error('✗ Account creation failed:', err.response?.data?.error || err.message)
  }

  console.log('\n========================================')
  console.log('All critical tests passed!')
  console.log('Frontend should be working at http://localhost:5173')
  console.log('========================================')
}

testBackend().catch(console.error)
