import { redirect } from 'next/navigation';

export default function DomainsRedirect() {
  redirect('/benchmarks/polymarket/explorer?view=source');
}
