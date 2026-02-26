import * as React from '@theia/core/shared/react';
import URI from '@theia/core/lib/common/uri';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget, LabelProvider, Key, KeyCode, codicon, CommonCommands } from '@theia/core/lib/browser';
import { CommandRegistry,Path, environment, isOSX } from '@theia/core/lib/common';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { WorkspaceCommands, WorkspaceService } from '@theia/workspace/lib/browser';
import { KeymapsCommands } from '@theia/keymaps/lib/browser';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';

@injectable()
export class CustomWelcomeWidget extends ReactWidget {
   static readonly ID = GettingStartedWidget.ID;

   @inject(CommandRegistry)
   protected readonly commandRegistry: CommandRegistry;

   @inject(WorkspaceService)
   protected readonly workspaceService: WorkspaceService;

   @inject(LabelProvider)
   protected readonly labelProvider: LabelProvider;

   @inject(EnvVariablesServer)
   protected readonly environments: EnvVariablesServer;

   @inject(WindowService)
   protected readonly windowService: WindowService;

   protected recentLimit = 3;
   protected recentWorkspaces: string[] = [];
   protected home?: string;

   @postConstruct()
   protected async init(): Promise<void> {
      this.id = CustomWelcomeWidget.ID;
      this.title.label = 'Welcome to bigArchiMate ';
      this.title.closable = true;
      this.title.iconClass = 'codicon codicon-home';

      this.recentWorkspaces = await this.workspaceService.recentWorkspaces();
      this.home = new URI(await this.environments.getHomeDirUri()).path.toString();

      this.update();
   }

   protected override render(): React.ReactNode {
      return (
         <div className='bam-welcome'>
            <div className='bam-hero'>
               <div className='bam-hero-left'>
                  <div className='bam-brand'>
                     <div className='bam-brand-row'>
                        <img
                           className='bam-logo'
                           src={new URL('product-icons/BAM-Logo.png', window.location.href).toString()}
                           alt='bigArchiMate Logo'
                        />
                        <div>
                           <div className='bam-title'>bigArchiMate</div>
                           <div className='bam-subtitle'>Open Source ArchiMate modeling based on Eclipse Theia + GLSP + Langium</div>
                        </div>
                     </div>
                  </div>

                  <div className='bam-description'>
                     <p>
                        ArchiMate is a widely adopted framework for representing the structure and behavior of enterprise architectures.
                        Traditional modeling tools are often proprietary, platform-dependent, and hard to extend.
                     </p>
                     <p>
                        <b>bigArchiMate</b> is a flexible, open-source ArchiMate modeling tool built on Eclipse Theia, leveraging GLSP and
                        Langium to provide an integrated modeling experience. It supports textual, graphical, and form-based modeling, kept
                        in sync via a shared semantic model — including automated multi-client syncing mechanisms.
                     </p>
                  </div>

                  <div className='bam-links'>
                     <a className='bam-link' href='https://github.com/borkdominik/bigarchimate' target='_blank' rel='noreferrer'>
                        GitHub
                     </a>
                     <span className='bam-link-sep'>•</span>
                     <a
                        className='bam-link'
                        href='https://github.com/borkdominik/bigArchiMate?tab=readme-ov-file#bigarchimate'
                        target='_blank'
                        rel='noreferrer'
                     >
                        Documentation
                     </a>
                     <span className='bam-link-sep'>•</span>
                     <a
                        className='bam-link'
                        href='https://www.opengroup.org/archimate-forum/archimate-overview'
                        target='_blank'
                        rel='noreferrer'
                     >
                        What is ArchiMate?
                     </a>
                  </div>
                  <div className='bam-section'>
                     <div className='bam-section-title'>Key Features</div>

                     <div className='bam-feature-grid'>
                        {FEATURES.map((f, index) => {
                           const rotated = ((index % 3) + Math.floor(index / 3)) % 3;
                           const shape = index % 2;
                           return (
                              <div key={f.title} className={`bam-card bam-feature bam-layer-${rotated % 3} bam-shape-${shape}`}>
                                 <div className='bam-feature-title'>{f.title}</div>
                                 <div className='bam-feature-text'>{f.text}</div>
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  <div className='bam-section'>
                     <div className='bam-section-title'>See it in action</div>
                     <div className='bam-gif-grid'>
                        <div className='bam-gif-item bam-layer-2'>
                           <div className='bam-gif-title'>Magic Edge Connector</div>
                           <img
                              src={new URL('gifs/GIF-magic-edge-connector.gif', window.location.href).toString()}
                              alt='Magic Edge Connector'
                           />
                        </div>
                        <div className='bam-gif-item bam-layer-1'>
                           <div className='bam-gif-title'>Textual, Graphical & Form-based Modeling</div>
                           <img
                              src={new URL('gifs/GIF-editing.gif', window.location.href).toString()}
                              alt='Textual, Graphical & Form-based Modeling'
                           />
                        </div>
                        <div className='bam-gif-item bam-layer-0'>
                           <div className='bam-gif-title'>Libavoid Edge Routing</div>
                           <img src={new URL('gifs/GIF-libavoid.gif', window.location.href).toString()} alt='Libavoid Edge Routing' />
                        </div>
                     </div>
                  </div>

                  <div className='bam-footer'>
                     <span>bigArchiMate • ArchiMate 3.2 • Built with Eclipse Theia + GLSP + sprotty-routing-libavoid</span>
                  </div>
               </div>

               <div className='bam-hero-right'>
                  <div className='bam-action-grid'> {this.renderQuickActions()}</div>
                  {this.renderRecent()}
               </div>
            </div>
         </div>
      );
   }

   protected renderRecent(): React.ReactNode {
      const items = this.recentWorkspaces;
      const paths = this.buildPaths(items);

      const content = paths.slice(0, this.recentLimit).map((p, i) => {
         const wsUri = new URI(items[i]);
         return (
            <div className='bam-recent-row' key={i}>
               <a
                  role='button'
                  tabIndex={0}
                  className='bam-recent-name'
                  onClick={() => this.openWorkspaceUri(wsUri)}
                  onKeyDown={e => {
                     if (this.isEnterKey(e)) {
                        this.openWorkspaceUri(wsUri);
                     }
                  }}
               >
                  {wsUri.path.base}
               </a>
               <div className='bam-recent-path'>{p}</div>
            </div>
         );
      });

      const more = paths.length > this.recentLimit && (
         <div className='bam-recent-row'>
            <a
               role='button'
               tabIndex={0}
               className='bam-action-link'
               onClick={this.doOpenRecentWorkspace}
               onKeyDown={e => {
                  if (this.isEnterKey(e)) {
                     this.doOpenRecentWorkspace();
                  }
               }}
            >
               More…
            </a>
         </div>
      );

      return (
         <div className='bam-card bam-recent'>
            <div className='bam-card-title'>
               <i className={codicon('history')} style={{ marginRight: 8 }} />
               Recent
            </div>

            {items.length > 0 ? (
               <>
                  {content}
                  {more}
               </>
            ) : (
               <div className='bam-empty-recent'>
                  You have no recent folders,{' '}
                  <a
                     role='button'
                     tabIndex={0}
                     className='bam-action-link'
                     onClick={this.doOpenFolder}
                     onKeyDown={e => {
                        if (this.isEnterKey(e)) {
                           this.doOpenFolder();
                        }
                     }}
                  >
                     open a folder
                  </a>{' '}
                  to start.
               </div>
            )}
         </div>
      );
   }

   protected renderQuickActions(): React.ReactNode {
      const requireSingleOpen = isOSX || !environment.electron.is();

      return (
         <div className='bam-card bam-actions'>
            <div className='bam-card-title'>Quick Actions</div>

            <div className='bam-action-grid'>
               {this.renderActionLink('New Model', this.doCreateNewModel)}
               {requireSingleOpen && this.renderActionLink('Open', this.doOpen)}
               {!requireSingleOpen && this.renderActionLink('Open File', this.doOpenFile)}
               {!requireSingleOpen && this.renderActionLink('Open Folder', this.doOpenFolder)}
            </div>
            <div className='bam-actions-sub'>
               {this.renderActionLink('Settings', this.doOpenPreferences)} ·{' '}
               {this.renderActionLink('Keyboard Shortcuts', this.doOpenKeyboardShortcuts)}
            </div>
         </div>
      );
   }

   protected renderActionLink(label: string, onClick: () => void): React.ReactNode {
      return (
         <a
            role='button'
            tabIndex={0}
            className='bam-action-link'
            onClick={onClick}
            onKeyDown={e => {
               if (this.isEnterKey(e)) {
                  onClick();
               }
            }}
         >
            {label}
         </a>
      );
   }

   protected isEnterKey(e: React.KeyboardEvent): boolean {
      return Key.ENTER.keyCode === KeyCode.createKeyCode(e.nativeEvent).key?.keyCode;
   }

   protected buildPaths(workspaces: string[]): string[] {
      const paths: string[] = [];
      workspaces.forEach(workspace => {
         const uri = new URI(workspace);
         const pathLabel = this.labelProvider.getLongName(uri);
         const path = this.home ? Path.tildify(pathLabel, this.home) : pathLabel;
         paths.push(path);
      });
      return paths;
   }

   protected openWorkspaceUri(uri: URI): void {
      return this.workspaceService.open(uri);
   }

   protected doOpenExternalLink(url: string): void {
      this.windowService.openNewWindow(url, { external: true });
   }

   protected doCreateNewModel = (): Promise<unknown> => this.commandRegistry.executeCommand('new.model');
   protected doOpen = (): Promise<unknown> => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN.id);
   protected doOpenFile = (): Promise<unknown> => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_FILE.id);
   protected doOpenFolder = (): Promise<unknown> => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_FOLDER.id);
   protected doOpenWorkspace = (): Promise<unknown> => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id);
   protected doOpenRecentWorkspace = (): Promise<unknown> =>
      this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
   protected doOpenPreferences = (): Promise<unknown> => this.commandRegistry.executeCommand(CommonCommands.OPEN_PREFERENCES.id);
   protected doOpenKeyboardShortcuts = (): Promise<unknown> => this.commandRegistry.executeCommand(KeymapsCommands.OPEN_KEYMAPS.id);
}
   const FEATURES = [
      {
         title: 'Textual, Graphical & Form-based Modeling',
         text: 'Work in the view you prefer. All editors stay synchronized through a shared semantic model.'
      },
      {
         title: 'GLSP-powered Diagram Editor',
         text: 'Modern, extensible diagramming based on the Graphical Language Server Protocol.'
      },
      {
         title: 'Langium Language Engineering',
         text: 'Strong parsing, validation, and language tooling for robust ArchiMate projects.'
      },
      {
         title: 'Package-based Project System',
         text: 'A scalable project structure for managing large architectures.'
      },
      {
         title: 'Magic Edge Connector',
         text: 'Intelligent edge creation that suggests valid relationships based on the model context.'
      },
      {
         title: 'Libavoid Edge Routing',
         text: 'High-quality orthogonal edge routing with obstacle avoidance, ' +
            'segment nudging, and automatic path optimization for clean, professional diagrams.'
      }
   ];

