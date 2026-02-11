import * as React from '@theia/core/shared/react';
import URI from '@theia/core/lib/common/uri';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget, LabelProvider, Key, KeyCode, codicon } from '@theia/core/lib/browser';
import { CommandRegistry,Path, environment, isOSX } from '@theia/core/lib/common';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { WorkspaceCommands, WorkspaceService } from '@theia/workspace/lib/browser';
import { CommonCommands } from '@theia/core/lib/browser';
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
                     <div className='bam-title'>bigArchiMate</div>
                     <div className='bam-subtitle'>Open Source ArchiMate modeling based on Eclipse Theia + GLSP + Langium</div>
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
                     {/* TODO: add actual documentation link */}
                     <a className='bam-link' href='https://github.com/' target='_blank' rel='noreferrer'>
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
                        {FEATURES.map(f => (
                           <div key={f.title} className='bam-card bam-feature'>
                              <div className='bam-feature-title'>{f.title}</div>
                              <div className='bam-feature-text'>{f.text}</div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className='bam-section'>
                     <div className='bam-section-title'>See it in action</div>

                     <div className='bam-gif-grid'>Gifs</div>
                  </div>

                  <div className='bam-footer'>
                     <span>bigArchiMate • ArchiMate 3.2 • Built with Eclipse Theia + GLSP</span>
                  </div>
               </div>

               <div className='bam-hero-right'>
                  <div className='bam-action-grid'> {this.renderQuickActions()}</div>
                  <div className='bam-section'>{this.renderRecent()}</div>
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
                     if (this.isEnterKey(e)) this.openWorkspaceUri(wsUri);
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
                  if (this.isEnterKey(e)) this.doOpenRecentWorkspace();
               }}
            >
               More…
            </a>
         </div>
      );

      return (
         <div className='bam-card'>
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
                        if (this.isEnterKey(e)) this.doOpenFolder();
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
   /*
   protected generateActionButtons(): React.ReactNode {
      return ACTIONS.map(a => (
         <button
            key={a.id}
            className={`bam-btn ${a.primary ? 'bam-btn-primary' : ''}`}
            onClick={() => this.execute(a.commandId, a.args)}
            title={a.description}
            type='button'
         >
            <span className={`bam-btn-icon ${a.iconClass ?? ''}`} />
            <span className='bam-btn-text'>{a.label}</span>
         </button>
      ));
   }
    */

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

   protected doCreateNewModel = () => this.commandRegistry.executeCommand('new.model');
   protected doCreateFile = () => this.commandRegistry.executeCommand(CommonCommands.NEW_UNTITLED_FILE.id);
   protected doOpen = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN.id);
   protected doOpenFile = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_FILE.id);
   protected doOpenFolder = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_FOLDER.id);
   protected doOpenWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id);
   protected doOpenRecentWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
   protected doOpenPreferences = () => this.commandRegistry.executeCommand(CommonCommands.OPEN_PREFERENCES.id);
   protected doOpenKeyboardShortcuts = () => this.commandRegistry.executeCommand(KeymapsCommands.OPEN_KEYMAPS.id);
}
   /*
   interface WelcomeAction {
      id: string;
      label: string;
      description: string;
      commandId: string;
      args?: unknown[];
      primary?: boolean;
      iconClass?: string;
   }

   const ACTIONS: WelcomeAction[] = [
      {
         id: 'open-folder',
         label: 'Open Folder',
         description: 'Open Folder as workspace',
         commandId: 'workspace:open',
         primary: true,
         iconClass: 'codicon codicon-folder-opened'
      }
      ];

    */

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
         title: 'Custom Model Service Facade',
         text: 'Designed for integration, automation, and custom workflows.'
      },
      {
         title: 'Magic Edge Connector',
         text: 'Intelligent edge creation that suggests valid relationships based on the model context.'
      }
   ];

