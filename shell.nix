with import <nixpkgs> {};

stdenv.mkDerivation {
    name = "node";
    buildInputs = [
	google-cloud-sdk
        openjdk
        nodejs-18_x
        nodejs-18_x.pkgs.pnpm
        # (pnpm.override { nodejs = nodejs-18_x ;})
    ];
    shellHook = ''
        pnpm add -g pnpm
        export PATH="$PWD/node_modules/.bin/:$PATH"
        export $(xargs <.env)
    '';
}
