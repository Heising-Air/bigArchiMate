import { ApplicationShell, ApplicationShellOptions, FrontendApplication, WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { ThemeServiceWithDB } from '@theia/monaco/lib/browser/monaco-indexed-db';
import { CustomFrontendApplication } from './frontend-application';
import { ThemeService } from './theme-service';
import { CustomWelcomeWidget } from './custom-welcome-widget';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   bind(ThemeService).toSelf().inSingletonScope();
   rebind(ThemeServiceWithDB).toService(ThemeService);

   rebind(FrontendApplication).to(CustomFrontendApplication).inSingletonScope();
   rebind(ApplicationShellOptions).toConstantValue(<ApplicationShell.Options>{
      bottomPanel: {
         initialSizeRatio: 0.25 // default: 0.382
      }
   });

   bind(CustomWelcomeWidget).toSelf().inSingletonScope();

   bind(WidgetFactory)
      .toDynamicValue(ctx => ({
         id: GettingStartedWidget.ID,
         createWidget: () => ctx.container.get(CustomWelcomeWidget)
      }))
      .inSingletonScope();
});
