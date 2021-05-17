import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class School {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    city: string;

    @Column()
    country: string;
}