import { ChangeBoundsOperation, Command, Dimension, JsonOperationHandler, ModelState, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { DiagramNode, ElementNode, JunctionNode, isElementNode } from '../../../language-server/generated/ast.js';
import {
   findGroupingContaining,
   getAbsolutePosition,
   getParentElementNode,
   isGroupingNode
} from '../../../language-server/util/ast-util.js';
import { ArchiMateCommand } from '../../common/command.js';
import { ArchiMateModelState } from '../../common/model-state.js';

@injectable()
export class ChangeBoundsOperationHandler extends JsonOperationHandler {
   operationType = ChangeBoundsOperation.KIND;
   @inject(ModelState) protected override modelState!: ArchiMateModelState;

   createCommand(operation: ChangeBoundsOperation): Command {
      return new ArchiMateCommand(this.modelState, () => this.changeBounds(operation));
   }

   protected changeBounds(operation: ChangeBoundsOperation): void {
      operation.newBounds.forEach(elementAndBounds => {
         const node =
            this.modelState.index.findElementNode(elementAndBounds.elementId) ??
            this.modelState.index.findJunctionNode(elementAndBounds.elementId);
         if (!node || !elementAndBounds.newPosition) {
            return;
         }

         const newAbsPos = elementAndBounds.newPosition;
         const newSize = elementAndBounds.newSize;

         // Reparent non-grouping nodes when dragged into or out of a grouping.
         // Groupings themselves are excluded — nested groupings are not supported.
         if (!(isElementNode(node) && isGroupingNode(node))) {
            this.reparentIfNeeded(node, newAbsPos, newSize);
         }

         // Store coordinates relative to the parent grouping, or absolute when at diagram level.
         const parent = getParentElementNode(node);
         if (parent) {
            const parentAbsPos = getAbsolutePosition(parent);
            const relX = newAbsPos.x - parentAbsPos.x;
            const relY = newAbsPos.y - parentAbsPos.y;
            // Clamp so the element body stays fully within the grouping bounds.
            node.x = Math.max(0, Math.min(relX, parent.width - newSize.width));
            node.y = Math.max(0, Math.min(relY, parent.height - newSize.height));
         } else {
            node.x = newAbsPos.x;
            node.y = newAbsPos.y;
         }
         node.width = newSize.width;
         node.height = newSize.height;
      });
   }

   /**
    * Moves the node into the grouping whose bounds contain the element's center point,
    * or promotes it back to the diagram root when dragged outside every grouping.
    * Updates both the containment array and the $container link so that subsequent
    * AST traversals (getParentElementNode, getAbsolutePosition) remain correct.
    */
   protected reparentIfNeeded(node: ElementNode | JunctionNode, newAbsPos: Point, newSize: Dimension): void {
      const diagram = this.modelState.diagram;
      const currentParent = getParentElementNode(node);
      const center: Point = { x: newAbsPos.x + newSize.width / 2, y: newAbsPos.y + newSize.height / 2 };
      const newParent = findGroupingContaining(center, this.modelState.diagram);

      if (currentParent === newParent) {
         return;
      }

      // Remove from current container.
      if (currentParent) {
         const idx = currentParent.children.indexOf(node);
         if (idx >= 0) {
            (currentParent.children as DiagramNode[]).splice(idx, 1);
         }
      } else {
         const idx = diagram.nodes.indexOf(node);
         if (idx >= 0) {
            (diagram.nodes as DiagramNode[]).splice(idx, 1);
         }
      }

      // Add to new container and repair the $container link.
      if (newParent) {
         (newParent.children as DiagramNode[]).push(node);
         (node as any).$container = newParent;
      } else {
         (diagram.nodes as DiagramNode[]).push(node);
         (node as any).$container = diagram;
      }
   }
}
