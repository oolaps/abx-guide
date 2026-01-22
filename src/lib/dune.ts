const DUNE_API_KEY = import.meta.env.VITE_DUNE_API_KEY;

// Public Aborean queries
export const DUNE_QUERIES = {
  ABX_SUPPLY_LOCKED: 6354422,      // ABX Supply and Locked by nix_eth
  VEABX_LOCKERS: 5947166,          // veABX Lockers
  FRESH_LOCKED_BY_WEEK: 6538679,   // Fresh ABX Locked by Week
  ABOREAN_EPOCHS: 6341322,         // Epochs data
  VOTING_PER_EPOCH: 6576955,       // Voting per epoch
};

export async function testDuneConnection() {
  const response = await fetch(
    `https://api.dune.com/api/v1/query/${DUNE_QUERIES.ABX_SUPPLY_LOCKED}/results`,
    {
      headers: {
        'X-Dune-API-Key': DUNE_API_KEY || '',
      },
    }
  );
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dune API error: ${response.status} - ${text}`);
  }
  
  const data = await response.json();
  return data;
}

export async function getABXPrice() {
  // Try DeFiLlama first - they track Abstract chain
  const response = await fetch(
    'https://coins.llama.fi/prices/current/abstract:0x4c68e4102c0f120cce9f08625bd12079806b7c4d'
  );
  
  if (!response.ok) {
    throw new Error(`DeFiLlama error: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}