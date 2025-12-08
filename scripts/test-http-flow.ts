

async function main() {
  console.log('🌐 Testing HTTP Flow (API Gateway + GraphQL)...');
  const url = 'http://localhost:3000/api/graphql';

  // 1. Define GraphQL Query
  const query = `
    mutation AgendarCita($input: AgendarCitaInput!) {
      agendarCita(input: $input) {
        id
        status
        serviceType
        scheduledDate
      }
    }
  `;

  // 2. Define Variables
  const variables = {
    input: {
      serviceType: 'Visa_Estudiante',
      scheduledDate: new Date(Date.now() + 172800000).toISOString(), // +2 days
      notes: "HTTP Test Booking"
    }
  };

  try {
    // 3. Make HTTP Request
    console.log(`📡 POST ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer ...' // Mock auth doesn't check token yet, but good to have placeholder
      },
      body: JSON.stringify({ query, variables })
    });

    // 4. Handle Response
    const status = response.status;
    console.log(`   ⬅️ Status: ${status}`);
    
    if (status !== 200) {
      const text = await response.text();
      console.error(`   ❌ Error Body:`, text);
      process.exit(1);
    }

    const json = await response.json();
    
    if (json.errors) {
      console.error('   ❌ GraphQL Errors:', JSON.stringify(json.errors, null, 2));
      process.exit(1);
    }

    console.log('   🎉 SUCCESS! GraphQL Response:', JSON.stringify(json.data, null, 2));

  } catch (error) {
    console.error('   ❌ Network/Script Error:', error);
    process.exit(1);
  }
}

main();
