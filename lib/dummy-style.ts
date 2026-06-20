// lib/dummy-style.ts
import React, { useState } from 'react';

// BAD PRACTICE: any types, weird casing, console.logs, unused imports
export function do_Something( a:any, b: any ) {
    console.log("doing something right now...")
    let x = a+b;
    return x;
}
