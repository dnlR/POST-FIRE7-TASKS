import { Component } from '@angular/core';
import { Task } from './task/task';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TaskDialogResult } from './task-dialog/task-dialog.component';
import { Observable } from 'rxjs';
import { Firestore, collection, doc, addDoc, deleteDoc, setDoc, collectionData, runTransaction } from '@angular/fire/firestore';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private dialog: MatDialog, private readonly db: Firestore) { }

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        const todoRef = collection(this.db, 'todo');
        addDoc(todoRef, result.task)
        // this.db.collection('todo').add(result.task);
      });
  }


  todoRef = collection(this.db, 'todo');
  todo = collectionData(this.todoRef, { idField: 'id' }) as Observable<Task[]>;

  inProgressRef = collection(this.db, 'inProgress');
  inProgress = collectionData(this.inProgressRef, { idField: 'id' }) as Observable<Task[]>;

  doneRef = collection(this.db, 'done');
  done = collectionData(this.doneRef, { idField: 'id' }) as Observable<Task[]>;

  drop(event: CdkDragDrop<Task[] | null>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    if (!event.previousContainer.data || !event.container.data) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];

    const previousTaskRef = doc(this.db, `${event.previousContainer.id}/${item.id}`);
    const currentTaskRef = collection(this.db, event.container.id);

    runTransaction(this.db, () => {
      const promise = Promise.all([
        deleteDoc(previousTaskRef),
        addDoc(currentTaskRef, item),
      ]);
      return promise;
    });
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult | undefined) => {
      if (!result) {
        return;
      }
      if (result.delete) {
        const taskRef = doc(this.db, `${list}/${task.id}`);
        deleteDoc(taskRef);
      } else {
        const taskRef = doc(this.db, `${list}/${task.id}`);
        setDoc(taskRef, task);
      }
    });
  }
}