#!/usr/bin/env python
import sqlite3
import argparse

def make_row(file, name, species, _class):
    return (
        f'{file}.pdf',
        name,
        f"${{r['{name}']}} - ${{r['{species}']}} ${{r['{_class}']}}",
        f"Saved character ${{r['{name}']}}...",
        f'{file}.jpg'
    )

def main():
    parser = argparse.ArgumentParser('makesheet')
    parser.add_argument('--database', help="SQLite database file")
    parser.add_argument('file', help="Filename prefix")
    parser.add_argument('name', help="Character name")
    parser.add_argument('species', help="Species or Race")
    parser.add_argument('class', metavar="_class", help="Class or Homeworld")
    args = parser.parse_args()

    db = sqlite3.connect(args.database)
    row = make_row(args.file, args.name, args.species, args._class)
    db.execute("""
        INSERT INTO SheetData (pdf_name, key_name, menu_item, save_message, image)
        VALUES (?, ?, ?, ?, ?)""", row)
    db.commit()
