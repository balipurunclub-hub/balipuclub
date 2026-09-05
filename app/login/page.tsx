import { redirect } from 'next/navigation';

/** Auth disabled — send old /login traffic to admin. */
export default function LoginPage() {
  redirect('/admin');
}
