import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    accounts?: any[];

    constructor(private accountService: AccountService) { }

    ngOnInit() {
        this.accountService.getAll()
            .pipe(first())
            .subscribe(accounts => this.accounts = accounts);
    }

    deleteAccount(AccountId: string) {
        const account = this.accounts!.find(x => x.AccountId === AccountId);
        account.isDeleting = true;
        this.accountService.delete(AccountId)
            .pipe(first())
            .subscribe(() => {
                this.accounts = this.accounts!.filter(x => x.AccountId !== AccountId)
            });
    }
}