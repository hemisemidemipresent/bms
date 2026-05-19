export const ZERO = [];
export const ONE = [[], [], []];

export function iz(a) {
    return a.length == 0;
}
export function eq(a, b) {
    if (typeof a == "number") {
        return a == b;
    }
    if (iz(a) || iz(b)) {
        return iz(a) == iz(b);
    }
    return eq(a[0], b[0]) && eq(a[1], b[1]) && eq(a[2], b[2]);
}
export function lt(a, b) {
    if (iz(b)) {
        return false;
    }
    if (iz(a)) {
        return true;
    }
    if (!eq(a[0], b[0])) {
        return lt(a[0], b[0]);
    }
    if (!eq(a[1], b[1])) {
        return lt(a[1], b[1]);
    }
    return lt(a[2], b[2]);
}
export function gt(a, b) {
    return !(lt(a, b) || eq(a, b));
}
export function add(a, b) {
    if (iz(a)) {
        return b;
    }
    if (iz(b)) {
        return a;
    }
    if (lt([a[0], a[1], []], [b[0], b[1], []])) {
        return b;
    }
    return [a[0], a[1], add(a[2], b)];
}
export function suc(a){return add(a,ONE);}
export function sub(a, b) {
    if (iz(a)) {
        return [];
    }
    if (iz(b)) {
        return a;
    }
    if (gt([a[0], a[1], []], [b[0], b[1], []])) {
        return a;
    }
    return sub(a[2], b[2]);
}
export function exp(a) {
    if (lt(a, [[], [ONE, [], []], []])) {
        return [[], a, []];
    }
    let p = s(a[1], [add(a[0], ONE), [], []])[0];
    return [a[0], add(p, sub(a, [a[0], p, []])), []];
}
// s(a,b) splits the terms of a into things ≥ b and things < b
export function s(a, b) {
    if (iz(a)) {
        return [[], []];
    }
    if (lt([a[0], a[1], []], b)) {
        return [[], a];
    }
    return [[a[0], a[1], s(a[2], b)[0]], s(a[2], b)[1]];
}
// l - last term
// if a = 0, return 0
// if a = ψ_b(c)+0, return a
// else a = ψ_b(c)+d, then find l(d)
export function l(a) {
    if (iz(a)) {
        return [];
    }
    if (iz(a[2])) {
        return a;
    }
    return l(a[2]);
}
// ω-log
export function log(a){
  if(iz(a)){return [];}
  let [p,q]=s(a[1],[suc(a[0]),[],[]]);
  if(iz(a[0])&&iz(p)){
    if(!lt(a[1],[[],[ONE,[],[]],[]])){
      if(eq(log(q),q)&&iz(q[2])&&lt(a[1],[ONE,[],[]])){return [a[0],a[1],[]];}
    }
    return q;
  }
  let m=add([a[0],p,[]],q);
  if(!lt(a[1],[a[0],[suc(a[0]),[],[]],[]])){
    if(eq(log(a[1]),a[1])&&iz(a[2])&&lt(a[1],[suc(a[0]),[],[]])){return [a[0],a[1],[]];}
  }
  return m;
}

// standardization magic
function ttc(a,b){
  if(iz(a)){return [];}
  if(iz(ttc(a[2],b))&&lt([a[0],a[1],[]],[b,[],[]])){return [];}
  return [a[0],a[1],ttc(a[2],b)];
}
function sp(a,b,c){
  if(iz(c)){return [a,b,[]];}
  if(lt(b,c[1])&&gt(c,[a,[],[]])){
    let t=ttc(c[1],suc(c[0]));
    return sp(a,add(t,sub([c[0],c[1],[]],[c[0],t,[]])),c[2]);
  }
  return sp(a,add(b,[c[0],c[1],[]]),c[2]);
}
export function sf(a){
  if(iz(a)){return [];}
  return add(sp(sf(a[0]),[],sf(a[1])),sf(a[2]));
}
