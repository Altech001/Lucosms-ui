import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Button from '@/utils/ui/button/Button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PaymentStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'success' | 'failed' | 'pending' | null;
  title: string;
  message: string;
}

const statusConfig = {
  success: {
    icon: <CheckCircle className="h-16 w-16 text-green-500" />,
    titleClass: 'text-green-600',
  },
  failed: {
    icon: <XCircle className="h-16 w-16 text-red-500" />,
    titleClass: 'text-red-600',
  },
  pending: {
    icon: <AlertTriangle className="h-16 w-16 text-yellow-500" />,
    titleClass: 'text-yellow-600',
  },
};

const PaymentStatusDialog: React.FC<PaymentStatusDialogProps> = ({ isOpen, onClose, status, title, message }) => {
  if (!status) return null;

  const config = statusConfig[status];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          {config.icon}
          <DialogTitle className={`text-2xl font-bold pt-4 ${config.titleClass}`}>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center text-gray-600">
          <p>{message}</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} variant="primary" className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentStatusDialog;
