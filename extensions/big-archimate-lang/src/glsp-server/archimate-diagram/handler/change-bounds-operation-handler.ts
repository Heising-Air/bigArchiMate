import { ChangeBoundsOperation, Command, JsonOperationHandler, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ArchiMateCommand } from '../../common/command.js';
import { ArchiMateModelState } from '../../common/model-state.js';
import { getParentElementNode } from '../../../language-server/util/ast-util.js';

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
         // we store the given bounds directly in our diagram node
         const parent = getParentElementNode(node)
         console.log("[ChangeBoundsOperation]", `Updating bounds for node ${node.id}) to x=${elementAndBounds.newPosition.x}, y=${elementAndBounds.newPosition.y}, width=${elementAndBounds.newSize.width}, height=${elementAndBounds.newSize.height}`);
         // for Nodes in a Grouping the relative position to the parent(grouping) gets stored
         if (parent) {
            node.x = elementAndBounds.newPosition.x - parent.x;
            node.y = elementAndBounds.newPosition.y - parent.y;
         } else {
            node.x = elementAndBounds.newPosition.x;
            node.y = elementAndBounds.newPosition.y;
         }
         node.width = elementAndBounds.newSize.width;
         node.height = elementAndBounds.newSize.height;
      });
   }
}
