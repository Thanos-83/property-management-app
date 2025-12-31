import Link from 'next/link';

function LinkAccount() {
  return (
    <div className='flex flex-col'>
      <Link href='/api/aurinko/auth?provider=Google'>Connet Gmail</Link>
    </div>
  );
}

export default LinkAccount;
