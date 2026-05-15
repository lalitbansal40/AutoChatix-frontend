import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { walletService } from 'service/wallet.service';
import useAuth from 'hooks/useAuth';

/**
 * Gate any write action behind an active subscription.
 * Superadmins bypass the check entirely.
 *
 * Usage:
 *   const { guard, gateOpen, closeGate } = usePlanGate();
 *   <Button onClick={() => guard(() => setOpen(true))}>Create</Button>
 *   <PlanGateModal open={gateOpen} onClose={closeGate} />
 */
export const usePlanGate = () => {
  const { user } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => walletService.getMySubscription(),
    staleTime: 5 * 60 * 1000,
  });

  const isSuperAdmin = (user as any)?.role === 'superadmin';
  const sub = data?.subscription;
  const hasActivePlan = isSuperAdmin || (sub?.is_active && sub?.payment_status === 'paid');

  const guard = (action: () => void | Promise<void>) => {
    if (hasActivePlan) {
      void action();
    } else {
      setGateOpen(true);
    }
  };

  const closeGate = () => setGateOpen(false);

  return { hasActivePlan, isSuperAdmin, guard, gateOpen, closeGate };
};
