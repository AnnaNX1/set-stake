import { Sdk } from '@unique-nft/sdk';
import { KeyringProvider } from '@unique-nft/accounts/keyring';
import { Keyring } from '@polkadot/keyring';

const seed = 'key remove clerk live debate ...';

const baseUrl = 'https://rest.quartz.uniquenetwork.dev/v1';
// const baseUrl = 'https://rest.opal.uniquenetwork.dev/v1';


async function createSigner(){
  const keyringProvider = new KeyringProvider({
    type: 'sr25519',
  });
  await keyringProvider.init();
  return keyringProvider.addSeed(seed);
}

function createAccount(seed) {
  const keyring = new Keyring({ type: 'sr25519' });
  const keyringPair = keyring.addFromMnemonic(seed);
  return {
    keyringPair,
    seed,
    address: keyringPair.address,
  };
}

async function setStake(client, address, amountInit) {
  const { decimals } = await client.common.chainProperties();
  const arr = amountInit.toString().split('.');
  let amount = arr[0] !== '0' ? arr[0] : '';
  if (arr[1]) {
      amount += arr[1] + Array(decimals - arr[1].length).fill('0').join('');
  } else {
    amount += Array(decimals).fill('0').join('');
  }
  return client.extrinsics.submitWaitResult({
        address: address,
        section: 'appPromotion',
        method: 'stake',
        args: [amount],
      });
}

const main = async () => {

  // create client
  const options = {
    baseUrl: baseUrl,
    signer: await createSigner(),
  };
  const client = new Sdk(options);
  const richAccountAddress = createAccount(seed);

  // весь застейченный баланс отображается в lockedBalance
  const initBalanceResponse = await client.balance.get({
    address: richAccountAddress.address,
  });
  console.log(initBalanceResponse);

  // set stake
  const amount = 100; // min 100
  const result = await setStake(client, richAccountAddress.address, amount);
  console.log(result);

  const val = await client.stateQuery.execute({
      endpoint: 'rpc',
      module: 'appPromotion',
      method: 'totalStaked',
    },
      {args: [{ Substrate: richAccountAddress.address }]}
  );
  console.log(val);
}

main().then(() => {}).catch(e => {
    console.log(e);
});
