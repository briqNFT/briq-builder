import { reactive } from 'vue';
import type { BuilderAction } from './BuilderActions';
import { builderStore } from './BuilderStore';
import type { SetData } from './SetData';

const { currentSet } = builderStore;

class BuilderHistory {
    command_history = [[]] as BuilderAction[][];
    command_index = 0;
    current_commands = [] as BuilderAction[];

    resetHistory() {
        this.command_history = [[]] as BuilderAction[][];
        this.command_index = 0;
        this.current_commands = [] as BuilderAction[];
    }

    push_command<T>(factory: new (set: SetData, params: T) => BuilderAction, data: T) {
        const command = new factory(currentSet.value, data);
        command.redo(currentSet.value);
        this.current_commands.push(command);
    }

    push_checkpoint() {
        if (this.command_index !== this.command_history.length - 1)
            this.command_history = this.command_history.slice(0, this.command_index + 1);
        this.command_history.push(this.current_commands);
        this.command_index++;
        this.current_commands = [];
    }

    undo() {
        if (this.current_commands.length !== 0)
            this.push_checkpoint();
        if (this.command_index <= 0)
            return;
        this.command_history[this.command_index].forEach((x) => x.undo(currentSet.value));
        this.command_index--;
    }

    redo() {
        if (this.command_index + 1 >= this.command_history.length)
            return;
        this.command_index++;
        this.command_history[this.command_index].forEach((x) => x.redo(currentSet.value));
    }
}

export const builderHistory = reactive(new BuilderHistory());
