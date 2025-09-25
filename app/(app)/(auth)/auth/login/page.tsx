import LoginForm from '@/components/auth/LoginForm';

export default async function LoginPage() {
  return (
    <section className='flex min-h-screen flex-col items-start bg-zinc-50 px-4 py-16 md:py-8 dark:bg-transparent'>
      <LoginForm />
    </section>
  );
}
