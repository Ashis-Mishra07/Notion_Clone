"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

const LoginModal = () => {
  return (
    <Dialog>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-lg font-semibold">Welcome to Notion Clone</h2>
          <p className="text-sm text-muted-foreground text-center">
            Please sign in to continue
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
