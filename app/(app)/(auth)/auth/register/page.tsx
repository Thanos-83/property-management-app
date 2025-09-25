import RegisterForm from '@/components/auth/RegisterForm';

export default async function RegisterPage() {
  return (
    <section className='flex min-h-screen flex-col items-start bg-zinc-50 px-4 py-16 md:py-8 dark:bg-transparent'>
      <RegisterForm />
    </section>
  );
}
