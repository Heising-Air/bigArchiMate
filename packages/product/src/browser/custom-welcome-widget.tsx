import * as React from '@theia/core/shared/react';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';

@injectable()
export class CustomWelcomeWidget extends ReactWidget {
   static readonly ID = GettingStartedWidget.ID;
   @postConstruct()
   protected init(): void {
      this.id = 'getting.started';
      this.title.label = 'Welcome';
      this.title.closable = true;
      this.update();
   }

   protected override render(): React.ReactNode {
      return (
         <div style={{ padding: 24 }}>
            <h1>Willkommen</h1>
            <p>Deine Custom Welcome Page</p>
         </div>
      );
   }
}
